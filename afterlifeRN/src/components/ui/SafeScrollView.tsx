import v_a3453e, { v_680bcc, v_5ab095, v_c4deb2, v_e662ae, v_298205 } from 'bapkr';
import { v_122070, v_326be8, v_472849, v_72945f, v_7e4944, v_3094a2, v_0e1f26, v_efd272, v_bfa1d6 } from 'rcmrninabrnb';
import { v_e0068c } from 'vvfgtwbmdpbnvhtfbtbgudicfmpscw';
import { v_c18c22 } from 'svuoaeceudfxfjvvpmmmchnwljywbphjgb';
import { v_1bfbd0, v_963c2c } from '../constants';
import { v_3a14f9, v_f3168c } from '../context/KeyboardScrollContext';

interface SafeScrollViewProps extends v_72945f {
  children: v_a3453e.ReactNode;
  style?: v_7e4944;
  contentContainerStyle?: v_7e4944;

  additionalBottomPadding?: number;

  showBottomBackground?: boolean;

  bottomBackgroundColor?: string;

  backgroundColor?: string;

  autoAdjustKeyboardPadding?: boolean;

  disableBottomPadding?: boolean;

  showStatusBarBackground?: boolean;

  statusBarBackgroundColor?: string;
}

const v_91ca58 = v_680bcc<v_122070, SafeScrollViewProps>(({
  children: v_21f619,
  style: v_7fa4e4,
  contentContainerStyle: v_9aecf5,
  additionalBottomPadding: v_86fc47 = 0,
  showBottomBackground: v_bb8530 = true,
  bottomBackgroundColor: v_53b2af = v_963c2c.bottomBackground || "#fafafa",
  backgroundColor: v_f7b9fb = v_963c2c.background || "#fafafa",
  autoAdjustKeyboardPadding: v_4d1023 = false,
  disableBottomPadding: v_9f47ad = false,
  showStatusBarBackground: v_036b39 = false,
  statusBarBackgroundColor: v_e72fb6 = '#FFFFFF',
  ...v_b1927c
}, v_6d4ed3) => {
  const v_033e14 = v_e0068c();
  const [v_7e4acc, v_de86c2] = v_5ab095(0);
  const v_90527e = v_e662ae<v_122070>(null);
  const v_73e70b = v_f3168c();

  const v_f9771e = v_c18c22(0);

  v_298205(v_6d4ed3, () => v_90527e.current as v_122070, []);

  v_c4deb2(() => {
    if (v_73e70b && v_4d1023 && v_90527e.current) {
      v_73e70b.registerScrollView(v_90527e.current);
    }
  }, [v_73e70b, v_4d1023]);

  v_c4deb2(() => {
    if (v_73e70b && v_4d1023) {
      v_73e70b.setKeyboardHeight(v_7e4acc);
    }
  }, [v_73e70b, v_4d1023, v_7e4acc]);

  v_c4deb2(() => {
    if (!v_4d1023) {
      return;
    }

    const v_ef3bab = v_326be8.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const v_ffd7d0 = v_326be8.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const v_3d0122 = v_0e1f26.addListener(v_ef3bab, (v_d48baf) => {
      const v_c86e33 = v_d48baf.endCoordinates.height;
      v_de86c2(v_c86e33);
    });

    const v_5ed003 = v_0e1f26.addListener(v_ffd7d0, () => {
      v_de86c2(0);
    });

    return () => {
      v_3d0122.remove();
      v_5ed003.remove();
    };
  }, [v_4d1023]);

  const v_acf836 =
    v_326be8.OS === 'ios'
      ? v_033e14.bottom
      : Math.max(v_f9771e, v_033e14.bottom);

  const v_f41ebf = v_4d1023 ? v_7e4acc : 0;

  const v_cebf7c = v_9f47ad
    ? v_86fc47 + v_f41ebf
    : v_acf836 + v_86fc47 + v_f41ebf;

  return (
    <View style={[v_d81136.wrapper, { backgroundColor: v_f7b9fb }]}>
      {v_036b39 && (
        <View
          style={[
            v_d81136.statusBarBackground,
            {
              height: v_033e14.top,
              backgroundColor: v_e72fb6,
            },
          ]}
          pointerEvents="none"
        />
      )}
      <ScrollView
        ref={v_90527e}
        style={[v_d81136.container, v_7fa4e4]}

        automaticallyAdjustKeyboardInsets={false}
        keyboardShouldPersistTaps={v_b1927c.keyboardShouldPersistTaps ?? "handled"}
        contentContainerStyle={(() => {

          if (!v_9aecf5) {
            return {
              paddingBottom: v_cebf7c,
            };
          }

          const v_761b4a = Array.isArray(v_9aecf5)
            ? v_9aecf5
            : [v_9aecf5];
          const v_e289e2 = Object.assign({}, ...v_761b4a.filter(Boolean));

          const { paddingVertical: v_e5156c, paddingTop: v_6b1680, paddingBottom: v_306c94, ...v_5344ee } = v_e289e2;

          return {
            ...v_5344ee,
            paddingTop: v_e5156c ?? v_6b1680,

            paddingBottom: v_cebf7c,
          };
        })()}
        {...v_b1927c}
      >
        {v_21f619}
      </ScrollView>
      {v_bb8530 && (
        <View
          style={[
            v_d81136.bottomBackground,
            {
              height: Math.max(v_cebf7c, 1),
              backgroundColor: v_53b2af,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
});

v_91ca58.displayName = 'SafeScrollViewInner';

const v_570c34 = v_680bcc<v_122070, SafeScrollViewProps>(({
  autoAdjustKeyboardPadding: v_4d1023 = false,
  ...v_b1927c
}, v_6d4ed3) => {

  if (v_4d1023) {
    return (
      <KeyboardScrollProvider enabled={true}>
        <SafeScrollViewInner ref={v_6d4ed3} autoAdjustKeyboardPadding={v_4d1023} {...v_b1927c} />
      </KeyboardScrollProvider>
    );
  }

  return <SafeScrollViewInner ref={v_6d4ed3} autoAdjustKeyboardPadding={false} {...v_b1927c} />;
});

v_570c34.displayName = 'SafeScrollView';

const v_d81136 = v_472849.create({
  wrapper: {
    flex: 1,
    position: 'relative',
  },
  container: {
    flex: 1,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 1000,
  },
  bottomBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 10,
  },
});

export default v_570c34;
export type { SafeScrollViewProps };

