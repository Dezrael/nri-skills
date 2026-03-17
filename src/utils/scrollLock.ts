let lockCount = 0;
let savedScrollY = 0;

let originalBodyOverflow = "";
let originalBodyPosition = "";
let originalBodyTop = "";
let originalBodyLeft = "";
let originalBodyRight = "";
let originalBodyWidth = "";

let originalHtmlOverflow = "";

export const lockBodyScroll = () => {
  lockCount += 1;
  if (lockCount > 1) {
    return;
  }

  const body = document.body;
  const html = document.documentElement;

  savedScrollY = window.scrollY || window.pageYOffset || 0;

  originalBodyOverflow = body.style.overflow;
  originalBodyPosition = body.style.position;
  originalBodyTop = body.style.top;
  originalBodyLeft = body.style.left;
  originalBodyRight = body.style.right;
  originalBodyWidth = body.style.width;
  originalHtmlOverflow = html.style.overflow;

  html.style.overflow = "hidden";
  body.style.overflow = "hidden";
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
};

export const unlockBodyScroll = () => {
  if (lockCount === 0) {
    return;
  }

  lockCount -= 1;
  if (lockCount > 0) {
    return;
  }

  const body = document.body;
  const html = document.documentElement;

  body.style.overflow = originalBodyOverflow;
  body.style.position = originalBodyPosition;
  body.style.top = originalBodyTop;
  body.style.left = originalBodyLeft;
  body.style.right = originalBodyRight;
  body.style.width = originalBodyWidth;
  html.style.overflow = originalHtmlOverflow;

  window.scrollTo(0, savedScrollY);
};
