declare module 'os-shim' {
  function tmpdir(): string;
  function homedir(): string;
  export = { tmpdir, homedir };
}
