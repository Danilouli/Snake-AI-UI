import { Component, PropsWithChildren } from "solid-js";

export const withMappedProps =
  <P extends Object, R extends Object>(callback: (props: P) => R) =>
  (Comp: Component<R>) =>
  (props: PropsWithChildren<P>) => {
    return <Comp {...callback(props)} />;
  };
