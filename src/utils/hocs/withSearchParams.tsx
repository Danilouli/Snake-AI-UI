import * as R from "ramda";
import { Component, PropsWithChildren } from "solid-js";
import {
  NavigateOptions,
  Params,
  SetParams,
  useSearchParams,
} from "solid-app-router";

export type WithSearchParamsProps<T> = {
  searchParams: T;
  setSearchParams: (
    params: SetParams,
    options?: Partial<NavigateOptions<T>> | undefined
  ) => void;
};

export const withSearchParams =
  <P extends WithSearchParamsProps<T>, T extends Params = Params>(
    Comp: Component<P>
  ) =>
  (props: PropsWithChildren<Omit<P, keyof WithSearchParamsProps<T>>>) => {
    const [searchParams, setSearchParams] = useSearchParams<T>();

    return (
      <Comp
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        {...(props as any)}
      />
    );
  };
