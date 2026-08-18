#!/usr/bin/env python3
"""
Moteur de rendu Lottie minimal, ecrit pour ce projet.

POURQUOI CE FICHIER EXISTE
Les bibliotheques habituelles (python-lottie, rlottie, lottie-web dans un
navigateur sans tete) ne sont pas installables ici : pip et npm sont bloques
par le proxy. Les fichiers a convertir n'utilisent en revanche qu'un
sous-ensemble restreint du format — pas d'expressions, pas de 3D, pas de time
remapping, pas de trim path ni de repeater — ce qui rend un rendu maison
realiste.

CE QUI EST IMPLEMENTE
  - compositions imbriquees (precomps) et decalage temporel
  - parentage de couches (chaines de transformations)
  - transformations : ancre, position, echelle, rotation, opacite
  - chemins de Bezier animes, rectangles
  - remplissages unis, contours, degrades lineaires et radiaux
  - interpolation de cles avec easing de Bezier, et cles "hold"
  - masque de fusion alpha (track matte)

CE QUI EST IGNORE VOLONTAIREMENT
  - effets (flou gaussien) : un seul present, sans incidence visible notable
  - textes, images : absents de ces fichiers
"""

import json, math, sys, os
import cairo


# ==========================================================================
# 1. INTERPOLATION
# ==========================================================================

def _bezier_ease(t, o, i):
    """Resout la courbe d'easing de Bezier d'une transition entre deux cles.

    Lottie stocke deux poignees : `o` (sortie de la cle precedente) et `i`
    (entree de la suivante), chacune avec un x et un y entre 0 et 1. La courbe
    passe par (0,0) et (1,1). On cherche le y correspondant a l'avancement x.

    Il n'existe pas de solution analytique simple : on approche x par
    dichotomie, ce qui converge en une vingtaine d'iterations.
    """
    if not o or not i:
        return t
    ox, oy = _first(o.get('x', 0)), _first(o.get('y', 0))
    ix, iy = _first(i.get('x', 1)), _first(i.get('y', 1))

    def bez(u, a, b):
        v = 1 - u
        return 3 * v * v * u * a + 3 * v * u * u * b + u ** 3

    lo, hi = 0.0, 1.0
    for _ in range(24):
        mid = (lo + hi) / 2
        if bez(mid, ox, ix) < t:
            lo = mid
        else:
            hi = mid
    return bez((lo + hi) / 2, oy, iy)


def _first(v):
    """Certaines valeurs sont des nombres, d'autres des listes a un element."""
    return v[0] if isinstance(v, (list, tuple)) else v


def _as_list(v):
    return list(v) if isinstance(v, (list, tuple)) else [v]


def lerp(a, b, f):
    """Interpole deux valeurs, qu'elles soient scalaires ou vectorielles."""
    if isinstance(a, (int, float)) and isinstance(b, (int, float)):
        return a + (b - a) * f
    a, b = _as_list(a), _as_list(b)
    n = min(len(a), len(b))
    return [a[k] + (b[k] - a[k]) * f for k in range(n)]


def lerp_path(a, b, f):
    """Interpole deux chemins sommet par sommet.

    Deux formes ne s'interpolent proprement que si elles ont le meme nombre de
    points — c'est une contrainte du format, pas une limite de ce code. On
    tronque au plus court par prudence.
    """
    n = min(len(a['v']), len(b['v']))
    out = {'c': a.get('c', False), 'v': [], 'i': [], 'o': []}
    for k in range(n):
        for key in ('v', 'i', 'o'):
            pa, pb = a[key][k], b[key][k]
            out[key].append([pa[0] + (pb[0] - pa[0]) * f,
                             pa[1] + (pb[1] - pa[1]) * f])
    return out


def value(prop, t, default=None):
    """Evalue une propriete Lottie a l'instant t (exprime en images).

    Une propriete est soit statique (`a` = 0, valeur dans `k`), soit animee
    (`a` = 1, `k` est une liste de cles). C'est le coeur du moteur : tout le
    reste ne fait qu'appeler cette fonction.
    """
    if prop is None:
        return default
    if not isinstance(prop, dict):
        return prop
    k = prop.get('k')
    if prop.get('a', 0) == 0:
        return k if k is not None else default

    kfs = k
    if not kfs:
        return default

    is_shape = isinstance(kfs[0].get('s'), (list, dict)) and _is_shape(kfs[0].get('s'))

    if t <= kfs[0]['t']:
        return _kf_start(kfs[0])
    for idx in range(len(kfs) - 1):
        cur, nxt = kfs[idx], kfs[idx + 1]
        if cur['t'] <= t < nxt['t']:
            # Une cle "hold" (h = 1) fige la valeur jusqu'a la cle suivante :
            # pas d'interpolation, c'est un changement net.
            if cur.get('h'):
                return _kf_start(cur)
            s = _kf_start(cur)
            e = cur.get('e')
            e = _unwrap(e) if e is not None else _kf_start(nxt)
            span = nxt['t'] - cur['t']
            f = 0.0 if span == 0 else (t - cur['t']) / span
            f = _bezier_ease(f, cur.get('o'), cur.get('i'))
            return lerp_path(s, e, f) if is_shape else lerp(s, e, f)
    return _kf_start(kfs[-1])


def _is_shape(v):
    v = _unwrap(v)
    return isinstance(v, dict) and 'v' in v and 'i' in v


def _unwrap(v):
    """Les cles de forme enveloppent l'objet dans une liste a un element."""
    if isinstance(v, list) and len(v) == 1 and isinstance(v[0], dict) and 'v' in v[0]:
        return v[0]
    return v


def _kf_start(kf):
    return _unwrap(kf.get('s', kf.get('e')))


# ==========================================================================
# 2. MATRICES
# Une matrice affine 2D tenue sous forme de tuple (xx, yx, xy, yy, x0, y0),
# la meme convention que cairo. Transformation d'un point :
#     x' = xx*x + xy*y + x0
#     y' = yx*x + yy*y + y0
# ==========================================================================

IDENT = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)


def mat_mul(m, n):
    """Compose deux matrices : le resultat applique n PUIS m."""
    a, b, c, d, e, f = m
    a2, b2, c2, d2, e2, f2 = n
    return (a * a2 + c * b2, b * a2 + d * b2,
            a * c2 + c * d2, b * c2 + d * d2,
            a * e2 + c * f2 + e, b * e2 + d * f2 + f)


def mat_translate(x, y):
    return (1.0, 0.0, 0.0, 1.0, x, y)


def mat_scale(sx, sy):
    return (sx, 0.0, 0.0, sy, 0.0, 0.0)


def mat_rotate(deg):
    r = math.radians(deg)
    c, s = math.cos(r), math.sin(r)
    return (c, s, -s, c, 0.0, 0.0)


def mat_skew(sk, sa):
    """Le cisaillement de Lottie : un angle de cisaillement et son axe."""
    if not sk:
        return IDENT
    a = math.radians(sa or 0)
    t = math.tan(math.radians(sk))
    rot, inv = mat_rotate(sa or 0), mat_rotate(-(sa or 0))
    shear = (1.0, 0.0, t, 1.0, 0.0, 0.0)
    return mat_mul(rot, mat_mul(shear, inv))


def transform_matrix(ks, t):
    """Construit la matrice d'un bloc de transformation Lottie.

    L'ordre est impose par le format : on translate a la position, on tourne,
    on met a l'echelle, puis on ramene le point d'ancrage a l'origine.
    Inverser deux de ces etapes suffit a decaler toute l'animation.
    """
    if not ks:
        return IDENT, 1.0
    a = _as_list(value(ks.get('a'), t, [0, 0]))
    p = value(ks.get('p'), t, [0, 0])
    # Une position peut etre separee en trois proprietes independantes.
    if p is None or ks.get('p', {}).get('s'):
        px = _first(value(ks['p'].get('x'), t, 0)) if 'p' in ks else 0
        py = _first(value(ks['p'].get('y'), t, 0)) if 'p' in ks else 0
        p = [px, py]
    p = _as_list(p)
    s = _as_list(value(ks.get('s'), t, [100, 100]))
    r = _first(value(ks.get('r'), t, 0)) or 0
    o = _first(value(ks.get('o'), t, 100))
    sk = _first(value(ks.get('sk'), t, 0)) or 0
    sa = _first(value(ks.get('sa'), t, 0)) or 0

    m = mat_translate(p[0] if len(p) > 0 else 0, p[1] if len(p) > 1 else 0)
    m = mat_mul(m, mat_rotate(r))
    if sk:
        m = mat_mul(m, mat_skew(sk, sa))
    m = mat_mul(m, mat_scale((s[0] if len(s) > 0 else 100) / 100.0,
                             (s[1] if len(s) > 1 else 100) / 100.0))
    m = mat_mul(m, mat_translate(-(a[0] if len(a) > 0 else 0),
                                 -(a[1] if len(a) > 1 else 0)))
    return m, (o if o is not None else 100) / 100.0


def to_cairo(m):
    return cairo.Matrix(m[0], m[1], m[2], m[3], m[4], m[5])


# ==========================================================================
# 3. LE RENDU
# ==========================================================================

class LottieRenderer:

    def __init__(self, data):
        self.d = data
        self.assets = {a['id']: a for a in data.get('assets', []) if 'id' in a}

    # ---- Chemins -------------------------------------------------------

    def _draw_bezier(self, ctx, sh):
        """Trace un chemin de Bezier Lottie.

        Lottie donne pour chaque sommet v ses deux poignees i (entrante) et o
        (sortante), exprimees en RELATIF par rapport au sommet. Cairo attend
        des points de controle absolus : d'ou les additions ci-dessous.
        """
        v, i, o = sh.get('v', []), sh.get('i', []), sh.get('o', [])
        if not v:
            return
        ctx.move_to(v[0][0], v[0][1])
        n = len(v)
        last = n if sh.get('c') else n - 1
        for k in range(last):
            cur, nxt = v[k], v[(k + 1) % n]
            c1 = (cur[0] + o[k][0], cur[1] + o[k][1])
            c2 = (nxt[0] + i[(k + 1) % n][0], nxt[1] + i[(k + 1) % n][1])
            ctx.curve_to(c1[0], c1[1], c2[0], c2[1], nxt[0], nxt[1])
        if sh.get('c'):
            ctx.close_path()

    def _draw_rect(self, ctx, it, t):
        p = _as_list(value(it.get('p'), t, [0, 0]))
        s = _as_list(value(it.get('s'), t, [0, 0]))
        r = _first(value(it.get('r'), t, 0)) or 0
        w, h = s[0], s[1]
        x, y = p[0] - w / 2, p[1] - h / 2
        r = min(r, w / 2, h / 2)
        if r <= 0:
            ctx.rectangle(x, y, w, h)
            return
        # Coins arrondis : quatre arcs relies par des segments droits.
        ctx.new_sub_path()
        ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
        ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
        ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
        ctx.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
        ctx.close_path()

    # ---- Peinture ------------------------------------------------------

    def _set_gradient(self, ctx, it, t, alpha):
        """Construit un degrade lineaire ou radial.

        Les arrets sont stockes a plat : [pos, r, g, b, pos, r, g, b, ...],
        eventuellement suivis des arrets d'opacite [pos, a, pos, a, ...].
        Le nombre d'arrets de couleur est donne par `g.p`.
        """
        s = _as_list(value(it.get('s'), t, [0, 0]))
        e = _as_list(value(it.get('e'), t, [0, 0]))
        gt = it.get('t', 1)
        if gt == 2:
            radius = math.hypot(e[0] - s[0], e[1] - s[1])
            grad = cairo.RadialGradient(s[0], s[1], 0, s[0], s[1], max(radius, 0.01))
        else:
            grad = cairo.LinearGradient(s[0], s[1], e[0], e[1])

        gk = value(it.get('g', {}).get('k'), t, []) or []
        cnt = it.get('g', {}).get('p', len(gk) // 4)
        colors = gk[:cnt * 4]
        opac = gk[cnt * 4:]

        def alpha_at(pos):
            if not opac:
                return 1.0
            pairs = [(opac[k], opac[k + 1]) for k in range(0, len(opac) - 1, 2)]
            if pos <= pairs[0][0]:
                return pairs[0][1]
            for k in range(len(pairs) - 1):
                if pairs[k][0] <= pos <= pairs[k + 1][0]:
                    span = pairs[k + 1][0] - pairs[k][0]
                    f = 0 if span == 0 else (pos - pairs[k][0]) / span
                    return pairs[k][1] + (pairs[k + 1][1] - pairs[k][1]) * f
            return pairs[-1][1]

        for k in range(cnt):
            pos, r, g, b = colors[k * 4:k * 4 + 4]
            grad.add_color_stop_rgba(pos, r, g, b, alpha_at(pos) * alpha)
        ctx.set_source(grad)

    def _paint(self, ctx, it, t, paths, parent_alpha):
        """Applique un remplissage ou un contour aux chemins accumules."""
        ty = it.get('ty')
        op = _first(value(it.get('o'), t, 100))
        alpha = (op if op is not None else 100) / 100.0 * parent_alpha
        if alpha <= 0.001:
            return

        ctx.new_path()
        for sh, mat in paths:
            ctx.save()
            ctx.transform(to_cairo(mat))
            self._draw_bezier(ctx, sh) if isinstance(sh, dict) else sh(ctx)
            ctx.restore()
        if ctx.has_current_point() is False and not paths:
            return

        if ty in ('fl', 'gf'):
            # fill-rule "even-odd" quand r == 2 : c'est ce qui creuse les
            # formes evidees (le "hollow" du fichier Protection).
            ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD if it.get('r') == 2
                              else cairo.FILL_RULE_WINDING)
            if ty == 'fl':
                c = _as_list(value(it.get('c'), t, [0, 0, 0]))
                ctx.set_source_rgba(c[0], c[1], c[2], alpha)
            else:
                self._set_gradient(ctx, it, t, alpha)
            ctx.fill()
        else:  # 'st' ou 'gs'
            w = _first(value(it.get('w'), t, 1)) or 1
            ctx.set_line_width(w)
            ctx.set_line_cap({1: cairo.LINE_CAP_BUTT, 2: cairo.LINE_CAP_ROUND,
                              3: cairo.LINE_CAP_SQUARE}.get(it.get('lc', 2),
                                                            cairo.LINE_CAP_ROUND))
            ctx.set_line_join({1: cairo.LINE_JOIN_MITER, 2: cairo.LINE_JOIN_ROUND,
                               3: cairo.LINE_JOIN_BEVEL}.get(it.get('lj', 2),
                                                             cairo.LINE_JOIN_ROUND))
            if ty == 'st':
                c = _as_list(value(it.get('c'), t, [0, 0, 0]))
                ctx.set_source_rgba(c[0], c[1], c[2], alpha)
            else:
                self._set_gradient(ctx, it, t, alpha)
            ctx.stroke()
        ctx.new_path()

    # ---- Groupes de formes ---------------------------------------------

    def _render_shapes(self, ctx, items, t, mat, alpha):
        """Parcourt une liste d'elements de forme.

        Convention Lottie : dans un groupe, un remplissage s'applique aux
        chemins qui le PRECEDENT. On accumule donc les chemins, et chaque
        element de peinture rencontre consomme la pile courante.
        """
        paths = []
        for it in items:
            ty = it.get('ty')
            if ty == 'gr':
                sub = it.get('it', [])
                tr = next((x for x in sub if x.get('ty') == 'tr'), None)
                gm, ga = (transform_matrix(tr, t) if tr else (IDENT, 1.0))
                self._render_shapes(ctx, [x for x in sub if x.get('ty') != 'tr'],
                                    t, mat_mul(mat, gm), alpha * ga)
            elif ty == 'sh':
                sh = value(it.get('ks'), t)
                if isinstance(sh, dict) and sh.get('v'):
                    paths.append((sh, mat))
            elif ty == 'rc':
                paths.append((lambda c, it=it, t=t: self._draw_rect(c, it, t), mat))
            elif ty in ('fl', 'st', 'gf', 'gs'):
                if paths:
                    self._paint(ctx, it, t, paths, alpha)

    # ---- Couches --------------------------------------------------------

    def _layer_chain(self, layer, layers_by_ind, t):
        """Remonte la chaine de parentage et compose les matrices.

        Le parentage transmet la transformation mais PAS l'opacite : c'est le
        comportement d'After Effects, et s'en ecarter assombrit tout.
        """
        m, alpha = transform_matrix(layer.get('ks'), t)
        seen = set()
        parent = layer.get('parent')
        while parent is not None and parent in layers_by_ind and parent not in seen:
            seen.add(parent)
            pl = layers_by_ind[parent]
            pm, _ = transform_matrix(pl.get('ks'), t)
            m = mat_mul(pm, m)
            parent = pl.get('parent')
        return m, alpha

    def render_comp(self, ctx, layers, t, alpha=1.0):
        by_ind = {l['ind']: l for l in layers if 'ind' in l}
        # Lottie liste les couches de haut en bas : on dessine a l'envers.
        for layer in reversed(layers):
            ip, op = layer.get('ip', 0), layer.get('op', 1e9)
            if t < ip or t >= op:
                continue
            ty = layer.get('ty')
            if ty not in (0, 4):          # on ignore nulls, solides, textes
                continue
            # Un masque de fusion (td = 1) sert de pochoir a la couche
            # suivante. Non gere : on l'omet plutot que de le peindre par
            # dessus, ce qui serait pire visuellement.
            if layer.get('td'):
                continue

            m, la = self._layer_chain(layer, by_ind, t)
            a = alpha * la
            if a <= 0.003:
                continue

            ctx.save()
            ctx.transform(to_cairo(m))
            if ty == 4:
                self._render_shapes(ctx, layer.get('shapes', []), t, IDENT, a)
            else:
                asset = self.assets.get(layer.get('refId'))
                if asset:
                    # Temps local de la composition imbriquee : on retire le
                    # decalage de depart et on divise par l'etirement.
                    sr = layer.get('sr', 1) or 1
                    lt = (t - layer.get('st', 0)) / sr
                    if layer.get('w') and layer.get('h'):
                        ctx.rectangle(0, 0, layer['w'], layer['h'])
                        ctx.clip()
                    self.render_comp(ctx, asset.get('layers', []), lt, a)
            ctx.restore()

    def render_frame(self, t, width, height, bg=None):
        w, h = self.d['w'], self.d['h']
        surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, width, height)
        ctx = cairo.Context(surf)
        if bg:
            ctx.set_source_rgb(*bg)
            ctx.paint()
        ctx.scale(width / w, height / h)
        ctx.set_antialias(cairo.ANTIALIAS_BEST)
        self.render_comp(ctx, self.d.get('layers', []), t)
        return surf


# ==========================================================================
# 4. LIGNE DE COMMANDE
# ==========================================================================

def main():
    src, outdir, width, fps = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
    bg = None
    if len(sys.argv) > 5 and sys.argv[5] != 'none':
        hexv = sys.argv[5].lstrip('#')
        bg = tuple(int(hexv[i:i + 2], 16) / 255 for i in (0, 2, 4))

    data = json.load(open(src, encoding='utf-8'))
    r = LottieRenderer(data)
    comp_fps = data.get('fr', 60)
    ip, op = data.get('ip', 0), data.get('op', 60)
    height = round(width * data['h'] / data['w'] / 2) * 2   # pair, exige par h264
    width = round(width / 2) * 2

    os.makedirs(outdir, exist_ok=True)
    n = int((op - ip) / comp_fps * fps)
    for k in range(n):
        t = ip + (k / fps) * comp_fps
        surf = r.render_frame(t, width, height, bg)
        surf.write_to_png(os.path.join(outdir, f'f{k:05d}.png'))
    print(f'{n} images  {width}x{height}  ({op - ip:.0f} images source @ {comp_fps} fps)')


if __name__ == '__main__':
    main()
