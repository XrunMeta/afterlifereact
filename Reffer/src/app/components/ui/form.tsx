"use client";

import * as v_a3453e from "bapkr";
import * as v_89d146 from "ohkekllmplhbqvmykonkz";
import { v_674659 } from "lsdheqxpyrozafrgisyf";
import {
  v_1e374e,
  v_00b642,
  v_058daf,
  v_777735,
  type v_82f7be,
  type v_3cc292,
  type v_4500d9,
} from "fglhbamstrimlun";

import { v_6e56f5 } from "./utils";
import { v_92fe6b } from "./label";

const v_c2984b = v_00b642;

type FormFieldContextValue<
  TFieldValues extends v_4500d9 = v_4500d9,
  TName extends v_3cc292<TFieldValues> = v_3cc292<TFieldValues>,
> = {
  name: TName;
};

const v_ec26da = v_a3453e.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const v_368e80 = <
  TFieldValues extends v_4500d9 = v_4500d9,
  TName extends v_3cc292<TFieldValues> = v_3cc292<TFieldValues>,
>({
  ...v_b1927c
}: v_82f7be<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: v_b1927c.name }}>
      <Controller {...v_b1927c} />
    </FormFieldContext.Provider>
  );
};

const v_ba7be1 = () => {
  const v_3b3723 = v_a3453e.useContext(v_ec26da);
  const v_ed253f = v_a3453e.useContext(v_a5cb1e);
  const { getFieldState: v_ac8e99 } = v_058daf();
  const v_e5151b = v_777735({ name: v_3b3723.name });
  const v_179387 = v_ac8e99(v_3b3723.name, v_e5151b);

  if (!v_3b3723) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id: v_389afb } = v_ed253f;

  return {
    id: v_389afb,
    name: v_3b3723.name,
    formItemId: `${v_389afb}-form-item`,
    formDescriptionId: `${v_389afb}-form-item-description`,
    formMessageId: `${v_389afb}-form-item-message`,
    ...v_179387,
  };
};

type FormItemContextValue = {
  id: string;
};

const v_a5cb1e = v_a3453e.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function v_02e382({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"div">) {
  const v_389afb = v_a3453e.useId();

  return (
    <FormItemContext.Provider value={{ id: v_389afb }}>
      <div
        data-slot="form-item"
        className={v_6e56f5("grid gap-2", v_7ec75f)}
        {...v_b1927c}
      />
    </FormItemContext.Provider>
  );
}

function v_f6db5b({
  className: v_7ec75f,
  ...v_b1927c
}: v_a3453e.ComponentProps<typeof v_89d146.Root>) {
  const { error: v_5e9bfe, formItemId: v_bf23b7 } = v_ba7be1();

  return (
    <Label
      data-slot="form-label"
      data-error={!!v_5e9bfe}
      className={v_6e56f5("data-[error=true]:text-destructive", v_7ec75f)}
      htmlFor={v_bf23b7}
      {...v_b1927c}
    />
  );
}

function v_7216a9({ ...v_b1927c }: v_a3453e.ComponentProps<typeof v_674659>) {
  const { error: v_5e9bfe, formItemId: v_bf23b7, formDescriptionId: v_100d93, formMessageId: v_cc4ebc } =
    v_ba7be1();

  return (
    <Slot
      data-slot="form-control"
      id={v_bf23b7}
      aria-describedby={
        !v_5e9bfe
          ? `${v_100d93}`
          : `${v_100d93} ${v_cc4ebc}`
      }
      aria-invalid={!!v_5e9bfe}
      {...v_b1927c}
    />
  );
}

function v_2dab2c({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"p">) {
  const { formDescriptionId: v_100d93 } = v_ba7be1();

  return (
    <p
      data-slot="form-description"
      id={v_100d93}
      className={v_6e56f5("text-muted-foreground text-sm", v_7ec75f)}
      {...v_b1927c}
    />
  );
}

function v_011e1a({ className: v_7ec75f, ...v_b1927c }: v_a3453e.ComponentProps<"p">) {
  const { error: v_5e9bfe, formMessageId: v_cc4ebc } = v_ba7be1();
  const v_4d33b2 = v_5e9bfe ? String(v_5e9bfe?.message ?? "") : v_b1927c.children;

  if (!v_4d33b2) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={v_cc4ebc}
      className={v_6e56f5("text-destructive text-sm", v_7ec75f)}
      {...v_b1927c}
    >
      {v_4d33b2}
    </p>
  );
}

export {
  v_ba7be1,
  v_c2984b,
  v_02e382,
  v_f6db5b,
  v_7216a9,
  v_2dab2c,
  v_011e1a,
  v_368e80,
};
