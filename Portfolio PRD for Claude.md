# Portfolio PRD for Claude

## Goal

I want to proceed to a redesign of my present portfolio. 

The goal is to show both my experience and my personality to candidate to UX Design or Product Designer jobs in a market which is saturated with juniors.

## The present

Here is the link to my present portfolio :

[https://marvinsrd.com/](https://marvinsrd.com/)

I started some designs that you can inspire from at this figma link :

https://www.figma.com/site/3JJ9sIQfiS66Q42cUS5sds/Portfolio-Site?node-id=68-11&t=v6dFyLfPh2BAc5uP-1

The main color should stay the same blue, with the same yellow as accent color.

## Portfolio structure and sections

The portfolio should contain the following sections :

- Home page
    - Navigation
    - Sentence “Hello [name of the visitor]”
    - The hero section should be a short paragraph summarizing who I am.
    - Below the paragraph, there should be a link to an article “Why i didn’t work for 2 years” which will be linking to an article explaining what i did.
    - One poster image by case studie linking to the detail
    - Site map and contact informations in the footer
- Work : every case study should a short showcase of what have been done, as recruiter won’t spend more than 30 seconds per case. There should be a “see more” link to see the detail of the process.
    - Petal constraint project which is in the pdf ([https://drive.google.com/file/d/1UcdHvaFC0cMb6z_OMJ2zgs4oKkd9AG41/view?usp=sharing](https://drive.google.com/file/d/1UcdHvaFC0cMb6z_OMJ2zgs4oKkd9AG41/view?usp=sharing))
    - Petal Service exclusion ([https://drive.google.com/file/d/1gTT8IvIHiEp7tlkj3i3bS3pL11N6HrZr/view?usp=sharing](https://drive.google.com/file/d/1gTT8IvIHiEp7tlkj3i3bS3pL11N6HrZr/view?usp=sharing))
    - Petal EMR Transfer ([https://drive.google.com/file/d/113m1D5TdpUNXFYxMMHm7pueukc-JcSWS/view?usp=sharing](https://drive.google.com/file/d/113m1D5TdpUNXFYxMMHm7pueukc-JcSWS/view?usp=sharing))
    - Fit-Plans case for which you can use the content is on the present portfolio linked in the begining ([https://marvinsrd.com/en/fit-plans-project](https://marvinsrd.com/en/fit-plans-project))
    - Soundcloud case ([https://marvinsrd.com/en/soundcloud-project](https://marvinsrd.com/en/soundcloud-project))
- Side quests
    - Hoot case study present on my portfolio ([https://marvinsrd.com/en/hoot-project](https://marvinsrd.com/en/hoot-project))
    - Master degree essay ([https://mar20.notion.site/a996a8ffb4234bb0a1c29682b55abe7b?v=cdd45c6f826b4b7a932d117112be5432&p=2f47efebd8db430ba6c7c9b424fd471c&pm=c](https://app.notion.com/p/2f47efebd8db430ba6c7c9b424fd471c?pvs=21))
- About section
    - You can take example on [that page](https://app.notion.com/p/7b42f4495afb418ebf25520fdc81a9a8?pvs=21), but I’m going to forward you the final text

If there are no images for the cases studies or other sections, generate placeholder images.

A sticky navigation on the side to each section of the case study should be implemented, along with a “position indicator” indicating how far the scrolling position is from the end.

There should be a sticky “go back” link to the previous page at any time.

The bottom section should lead to a following case study.

## Portfolio examples

I want you to take inspiration from the following examples :

### Overall

- [https://www.rachelchen.tech/](https://www.rachelchen.tech/)
- [https://www.bevyip.com/](https://www.bevyip.com/)
- [https://richarddu.com/](https://richarddu.com/)

### Homepage simplicity and tone

- [https://shedsgns.me/](https://shedsgns.me/)
- [https://www.marvinschwaibold.com/](https://www.marvinschwaibold.com/)
- [https://mayagao.com/](https://mayagao.com/)
- [https://emilkowal.ski/](https://emilkowal.ski/)

### Case study section

- [https://diana.lu/hyper#app](https://diana.lu/hyper#app)
- [https://rauno.me/notes/2](https://rauno.me/notes/2) (for the case study, tone and annotations)
- [https://www.marco.fyi/work/take-out](https://www.marco.fyi/work/take-out) (for the nav and showcase)
- [https://alvinn.design/projects/tedxsfu](https://alvinn.design/projects/tedxsfu) (for the showcase)
- [https://amylalai.com/untitledlyrics-fromhome](https://amylalai.com/untitledlyrics-fromhome) (for the case study section)
- [https://www.justinmasondesign.com/](https://www.justinmasondesign.com/)

## Technical constraints

For performances purposes, I want all the content to be loaded only once, and as shortly as possible, when arriving on the website, ensuring a good experience and no loading when everything is charged. No database needed, choose any library you think would be suited. 

I want transitions when going from one page to another, and a loader at the begining if necessary.

I want it to be accessible on mobile phone (responsive)

Annotate each line of code so that it can be understood by a beginner.

I want to keep asking for the name of the visitor in a form when arriving on the website. The name indicated should be saved as a variable that is not stored in database. Ensure the form is secured.

Use Github to version it the website and keep the conversation in a generated md file so that i don’t lose any information when flushing the context.  

## Other

Explain every one of your decisions and challenge them. Evaluate the present portfolio, provide any suggestion that you judge as useful.