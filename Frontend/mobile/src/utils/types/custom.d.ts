declare namespace JSX {
  interface IntrinsicElements {
    textarea: React.DetailedHTMLProps<
      React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        bindinput?: (e: any) => void;
      },
      HTMLTextAreaElement
    >;
    input: React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement> & {
        bindinput?: (e: any) => void;
        focus?: string;
      },
      HTMLInputElement
    >;
    text: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        bindtap?: ((e: any) => void) | (() => void);
        bindinput?: (e: any) => void;
      },
      HTMLElement
    >;
    view: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLDivElement> & {
        bindtap?: ((e: any) => void) | (() => void);
      },
      HTMLDivElement
    >;
  }
} 