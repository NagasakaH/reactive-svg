import {marked} from 'marked';
import chroma = require('chroma-js');
import './overlay.css';

type event = {
  name: string;
  markdownFile?: string;
  additionalHTMLContent?: string;
};

export type reactiveSVGSettings = {baseURL: string; events: event[]};

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
      openOverlay({
        markdownFile: settings.baseURL + event.markdownFile,
        additionalHTMLContent: event.additionalHTMLContent,
      });
    };
    addEventToRectangle(ref, event.name, onClick);
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
  click: () => void
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
      node.addEventListener('mouseover', () => {
        console.log('mouseover');
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
        console.log('mouseout');
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
type openOverlayProps = {
  markdownFile: string | undefined;
  additionalHTMLContent?: string | undefined;
};
function openOverlay(props: openOverlayProps) {
  const obj = document.getElementById('overlay');
  const content = document.getElementById('overlayContent');
  const body = document.body;
  if (obj && content) {
    obj.style.display = 'block';
    body.style.overflow = 'hidden';
    if (props.markdownFile) {
      loadStaticFile(props.markdownFile).then(text => {
        const parsedText = marked(text);
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
  const body = document.body;
  if (obj) {
    obj.style.display = 'none';
    body.style.overflow = 'auto';
  }
}
