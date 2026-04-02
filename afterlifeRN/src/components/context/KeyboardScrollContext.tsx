import v_a3453e, { v_af12cb, v_76a8a9, v_e662ae, v_de06a3 } from "bapkr";
import {
  v_122070,
  v_79c4f2,
  v_0e1f26,
  v_326be8,
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

    if (v_c86e33 > 0 && v_e99f51.current && v_d2ac6b.current > 0) {
      setTimeout(() => {
        v_e99f51.current?.scrollTo({
          y: Math.max(0, v_d2ac6b.current - 120),
          animated: true,
        });
      }, 100);
    }
  }, []);

  const v_bf98ad = v_de06a3(
    (event: v_bd64bf<v_9ae72d>) => {
      if (!v_e99f51.current || !v_d20c84) return;

      const v_5f5d6d = v_d48baf.target;
      if (!v_5f5d6d) return;

      setTimeout(() => {
        if (!v_e99f51.current) return;

        (v_5f5d6d as any).measureInWindow?.(
          (v_428b8c, v_e80f25, v_11dece, v_65a2cd) => {

            v_d2ac6b.current = v_e80f25;

            if (v_399006.current > 0) {
              v_e99f51.current?.scrollTo({
                y: Math.max(0, v_e80f25 - 200),
                animated: true,
              });
            }
          }
        );

        if (!(v_5f5d6d as any).measureInWindow) {

          v_e99f51.current?.scrollToEnd({ animated: true });
        }
      }, 300);
    },
    [v_d20c84]
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
