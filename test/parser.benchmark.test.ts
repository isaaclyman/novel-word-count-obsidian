import { countMarkdown } from "logic/parser";
import { countMarkdownObsidian } from "logic/parser-obsidian";
import { countMarkdownObsolete } from "logic/parser-old";

const words500 = `
There let without the will began. She of are is for by the watch. England almost at be letter. [[literature]] rock the the. Not in means and with in tell that frame. Writer scarcely years the his but the [[fighting]] 4. Water the by various course didnt. Of searched unto to painted performing of. Might would not the wing the he the. And to close one created whereas was. Distinct had an and time they. I haunt very old dark young from doing. Symbol to and of life fervently. Word of by i and and wont. The some he how her can. About from improvement meddle with i. Importance prejudices thought Bonaparte be because. Heard visit etc planted find the scattered. Silver just till as extracted. Great of out transcribe the waiting. Make yore them la that Christian. Caution leader out is owners German. Much in breath and thoughts crept. In discovered murmur hastings ought of of to. The has equipment according la [[farther]]. Is not of strength only means. Heroes would but of additional since satisfactory. As prayer had that well the than. Hats lord buy anniversary constant [[lifted Sunday]]. The find merit is of fuel mill i most. Dog our of sent were dared go. Purpose think on consulted almost now. His will all he and as to alter. 

\`\`\`dataview
code block
blah blah blah
blah blah blah
\`\`\`

Delivered had are secured the done after meet. 
That how to that else another ordinary it. And the resent demanded little seek. [[storm post]] [[inhabitants dressed]] branch and that at would. Or english crime out with it. Quantity every woman their the is. Him any months to [[impression]] mentioned usual. In the away the uttered to be. The namely had tank ambassador from at. And in %%inline comment%% close his if. Nature the bed against afterwards moderate. [[hopes slaves]] or she the the by. Smaller but and to creation support. Forwards what again think of. Usually her from its the i. Man it conspicuous indeed no lost. 
The the when with the will. That side grandson depends into been with the attended. I and reading you only or urged phrases. The not the must could could. Thou in hours was and in. That me [[loud suffer]] the and. Know good cars enough it but. Of of childhood perspective youth. A your for Cicero Mr weak day. Thought would not much to relation. Promising with in gloom in he.

%%
Ignored block comment
%%

Disappointment guess in the which resembled. Which with and certainly work tied. Narrow pardon part fully sick wishes on. [[message]] together one of azure. Truth absurd i not seals population. And trial often some they occasions said life. William all if his mile was. Taxation still its will war the. I secret unusual the of pie. The or growing [[ring noise]] of the he. Belgian none just for death other since. On as do toward resident to obligation. In sanction day boisterous guests delight. At this who and artful. Sue to shorter interesting wouldnt eleven eating your. Such meaning is system find of of. To or the men to cold meaning. In if quit window. Troops are were seems odds sorry.
`;

describe('parser benchmark', () => {
  it('parses 10,000 files with the Obsidian parser', () => {
    const label = 'obsidian parser - 10k files';
    console.time(label);
    for (let it = 0; it < 10_000; it++) {
      const result = countMarkdownObsidian(words500);
    }
    console.timeEnd(label);
  });

  it('parses 10,000 files with the old parser', () => {
    const label = 'old parser - 10k files';
    console.time(label);
    for (let it = 0; it < 10_000; it++) {
      const result = countMarkdownObsolete(words500);
    }
    console.timeEnd(label);
  });

  it('parses 10,000 files with the new parser', () => {
    const label = 'new parser - 10k files';
    console.time(label);
    for (let it = 0; it < 10_000; it++) {
      const result = countMarkdown(words500, {
        excludeCodeBlocks: true,
        excludeComments: true,
      });
    }
    console.timeEnd(label);
  });

  it('parses a very large file with the Obsidian parser', () => {
    const label = 'obsidian parser - large file';
    console.time(label);
    const result = countMarkdownObsidian(words500.repeat(10_000));
    console.timeEnd(label);
  });

  it('parses a very large file with the old parser', () => {
    const label = 'old parser - large file';
    console.time(label);
    const result = countMarkdownObsolete(words500.repeat(10_000));
    console.timeEnd(label);
  });

  it('parses a very large file with the new parser', () => {
    const label = 'new parser - large file';
    console.time(label);
    const result = countMarkdown(words500.repeat(10_000), {
      excludeCodeBlocks: true,
      excludeComments: true,
    });
    console.timeEnd(label);
  });

  
});
