import * as R from "ramda";
import { Component, PropsWithChildren } from "solid-js";
import { useParams, Params } from "solid-app-router";

type WithParamsProps<T> = {
  params: T;
};

export const withParams =
  <P extends WithParamsProps<T>, T extends Params = Params>(
    Comp: Component<P>
  ) =>
  (props: PropsWithChildren<Omit<P, keyof WithParamsProps<T>>>) => {
    return <Comp params={useParams()} {...(props as any)} />;
  };
