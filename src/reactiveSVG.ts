import {marked} from 'marked';
import {markedHighlight} from 'marked-highlight';
import hljs from 'highlight.js';
import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import chroma from 'chroma-js';
import './overlay.css';
import 'highlight.js/styles/default.css';

// marked設定
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, {language}).value;
    },
  })
);

export type reactiveSVGEvent = {
  name: string;
  markdownFile?: string;
  replacementCandidates?: reactiveSVGReplacementPair[];
  additionalHTMLContent?: string;
  callback?: () => void;
  animation?: boolean;
};

export type reactiveSVGReplacementPair = {
  from: RegExp;
  to: string;
};

export type reactiveSVGSettings = {
  baseURL: string;
  events: reactiveSVGEvent[];
  replacementCandidates?: reactiveSVGReplacementPair[];
};

async function loadStaticFile(filePath: string) {
  const res = await fetch(filePath);
  if (!res.ok) {
    return '';
  }
  return res.text();
}

export function loadSettings(
  settings: reactiveSVGSettings,
  ref: SVGSVGElement
) {
  for (const event of settings.events) {
    const onClick = async () => {
      if (event.markdownFile) {
        let replacementCandidates = new Array<reactiveSVGReplacementPair>();
        if (settings.replacementCandidates) {
          replacementCandidates = replacementCandidates.concat(
            settings.replacementCandidates
          );
        }
        if (event.replacementCandidates) {
          replacementCandidates = replacementCandidates.concat(
            event.replacementCandidates
          );
        }
        openOverlay({
          markdownFile: settings.baseURL + event.markdownFile,
          additionalHTMLContent: event.additionalHTMLContent,
          replacementCandidates: replacementCandidates,
        });
      }
      if (event.callback) {
        event.callback();
      }
    };
    addEventToRectangle(ref, event.name, onClick, event.animation);
  }

  // overlayが存在しない場合は生成する
  if (document.getElementById('overlay') === null) {
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    const overlayText = document.createElement('div');
    overlayText.id = 'overlayText';
    const overlayContent = document.createElement('div');
    overlayContent.id = 'overlayContent';
    overlayText.appendChild(overlayContent);
    overlay.appendChild(overlayText);
    const closeButton = document.createElement('div');
    closeButton.onclick = closeOverlay;
    closeButton.id = 'overlayClose';
    const darkenColor = chroma('white').darken().hex();
    closeButton.addEventListener('mouseover', () => {
      closeButton.style.backgroundColor = darkenColor;
    });
    closeButton.addEventListener('mouseout', () => {
      closeButton.style.backgroundColor = 'white';
    });
    const text = document.createElement('div');
    text.id = 'centeredElement';
    text.innerText = 'Close';
    closeButton.appendChild(text);
    overlay.appendChild(closeButton);
    document.body.appendChild(overlay);
  }
}

function addEventToRectangle(
  ref: SVGSVGElement,
  name: string,
  click: () => void,
  animation: boolean | undefined
) {
  if (ref) {
    const nodes = Array.from(
      ref.querySelectorAll('[data-name="' + name + '"]')
    );
    for (const node of nodes) {
      const children = Array.from(node.children);
      const originalColors = new Array<string | null>();
      for (const child of children) {
        originalColors.push(child.getAttribute('fill'));
      }
      node.removeEventListener('click', click);
      node.addEventListener('click', click);
      if (animation === undefined || animation === true) {
        node.addEventListener('mouseover', () => {
          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            const color = originalColors[i];
            if (child.tagName === 'rect' && color) {
              const newColor = chroma(color).darken().hex();
              child.setAttribute('fill', newColor);
            }
          }
        });
        node.addEventListener('mouseout', () => {
          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.tagName === 'rect') {
              const newColor = originalColors[i];
              child.setAttribute('fill', newColor ? newColor : '#000000');
            }
          }
        });
      }
    }
  }
}

type openOverlayProps = {
  markdownFile: string | undefined;
  additionalHTMLContent?: string | undefined;
  replacementCandidates?: reactiveSVGReplacementPair[];
};

function openOverlay(props: openOverlayProps) {
  const obj = document.getElementById('overlay');
  const content = document.getElementById('overlayContent');
  if (obj && content) {
    obj.style.display = 'block';
    disableBodyScroll(obj);
    if (props.markdownFile) {
      loadStaticFile(props.markdownFile).then(text => {
        let replacedText = text;
        if (props.replacementCandidates) {
          for (const replacementCandidate of props.replacementCandidates) {
            replacedText = replacedText.replaceAll(
              replacementCandidate.from,
              replacementCandidate.to
            );
          }
        }
        const parsedText = marked(replacedText, {
          mangle: false,
          headerIds: false,
        });
        if (props.additionalHTMLContent) {
          content.innerHTML = parsedText + props.additionalHTMLContent;
        } else {
          content.innerHTML = parsedText;
        }
      });
    }
  }
}

function closeOverlay() {
  const obj = document.getElementById('overlay');
  if (obj) {
    obj.style.display = 'none';
    enableBodyScroll(obj);
  }
}
