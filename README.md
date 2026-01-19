## Orbit

Originally, this project began as a "food journal" with a very simple data model. A list of text entries containing dates eventually evolved into having tags. With the power of tags, this opened up tremendous other uses like various list taking, organizing personal tasks and managing personal affairs.

Today, I continue to expand on this project with the mindset of keeping things generic and multi-purpose.

Much of what is currently in the pipeline for this project revolves around enriching the "activities" by allowing custom properties to be configured which can provide even further use cases (workout tracker, collection manager, etc.)

I am always open to suggestions and feedback and happy if anyone wants to share or improve on anything I am doing here.

### Tech stack & Conventions

I chose Lit because I like native and Lit just feels so damn good. It provides the necessary reactivity other popular component frameworks do, and some of the syntactic sugar I like from Vue, but with far fewer demands on the developer.

Typescript because d'uh.

Components try to follow a consistent pattern of residing in a directory which carries the same name they do. File names for components are kebab-case, in order to be consistent with their related HTML tag names. Models, interfaces and descriptive data structures are in .models.ts files, while custom events are in .events.ts files. In a few of the more rare cases, there will also be some Storybook stories, which are in .stories.ts files.

#### Import convention

Imports are divided into a few conceptual areas, and ordered based on this distinction.

The order is as follows:

- third party libraries
- first party models/classes/interfaces
- first party events
- first party components
- first party styles

Perhaps should consider having a limit on maximum number of imports in a single file. It feels as though extreme importing (arguably 20+) likely is an indicator that some component should be broken up.

### UI Library

Some components I frequently use here are coming from another library I maintain; creatively called [@ss/ui](https://github.com/SikoSoft/ui). (thank you!)

All of these components originally started in this project, but at some point were deemed generic enough to be broken out for re-use. Some of the components I actually am using in other places now.

### Back-end

The [back-end API](https://github.com/SikoSoft/gapi) is currently built as a Azure function app. More information on these endpoints and that setup can be found there.
