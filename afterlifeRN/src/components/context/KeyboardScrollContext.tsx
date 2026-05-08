import v_a3453e, { v_af12cb, v_76a8a9, v_e662ae, v_de06a3 } from "bapkr";
import {
  v_122070,
  v_bd64bf,
  v_9ae72d,
} from "rcmrninabrnb";

interface KeyboardScrollContextType {
  registerScrollView: (scrollView: v_122070) => void;
  scrollToFocusedInput: (event: v_bd64bf<v_9ae72d>) => void;
  setKeyboardHeight: (height: number) => void;
}

const v_0fcf43 = v_af12cb<KeyboardScrollContextType | null>(null);

interface KeyboardScrollProviderProps {
  children: v_a3453e.ReactNode;
  enabled: boolean;
}

export const KeyboardScrollProvider: v_a3453e.FC<KeyboardScrollProviderProps> = ({
  children: v_21f619,
  enabled: v_d20c84,
}) => {
  const v_e99f51 = v_e662ae<v_122070 | null>(null);
  const v_399006 = v_e662ae(0);
  const v_d2ac6b = v_e662ae(0);

  const v_015ed8 = v_de06a3((scrollView: v_122070) => {
    v_e99f51.current = v_ca4bf8;
  }, []);

  const v_de86c2 = v_de06a3((v_c86e33) => {

    v_399006.current = v_c86e33;
  }, []);

  const v_bf98ad = v_de06a3(
    (event: v_bd64bf<v_9ae72d>) => {

      void v_d48baf;
      void v_e99f51;
      void v_d20c84;
    },
    [v_d20c84],
  );

  if (!v_d20c84) {
    return <>{v_21f619}</>;
  }

  return (
    <KeyboardScrollContext.Provider
      value={{ registerScrollView: v_015ed8, scrollToFocusedInput: v_bf98ad, setKeyboardHeight: v_de86c2 }}
    >
      {v_21f619}
    </KeyboardScrollContext.Provider>
  );
};

export const v_f3168c = () => v_76a8a9(v_0fcf43);
