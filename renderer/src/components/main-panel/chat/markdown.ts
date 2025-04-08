import MarkdownIt from 'markdown-it';
import katex from 'katex';
import markdownItKatex from 'markdown-it-katex';
import { pinkLog } from '@/views/setting/util';

const md = new MarkdownIt();

md.use(markdownItKatex, {
    throwOnError: false,
    errorColor: '#cc0000'
});

export const markdownToHtml = (markdown: string) => {
    return md.render(markdown);
};

export const copyToClipboard = (text: string) => {
    return navigator.clipboard.writeText(text);
};
