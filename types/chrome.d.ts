declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

declare namespace chrome {
    const storage: any;
}
