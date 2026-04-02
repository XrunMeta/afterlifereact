import v_a3453e from 'bapkr';
import { v_326be8, v_472849, v_3094a2, v_7e4944, v_700696 } from 'rcmrninabrnb';
import { v_e0068c } from 'vvfgtwbmdpbnvhtfbtbgudicfmpscw';
import { v_c18c22 } from 'svuoaeceudfxfjvvpmmmchnwljywbphjgb';
import { v_1bfbd0, v_963c2c } from '../constants';

interface SafeViewProps {
    children: v_a3453e.ReactNode;
    style?: v_7e4944;

    additionalBottomPadding?: number;

    showBottomBackground?: boolean;

    bottomBackgroundColor?: string;

    backgroundColor?: string;

    showStatusBarBackground?: boolean;

    statusBarBackgroundColor?: string;
}

const SafeView: v_a3453e.FC<SafeViewProps> = ({
    children: v_21f619,
    style: v_7fa4e4,
    additionalBottomPadding: v_86fc47 = 0,
    showBottomBackground: v_bb8530 = true,
    bottomBackgroundColor: v_53b2af = v_963c2c.bottomBackground || "#fafafa",
    backgroundColor: v_f7b9fb = v_963c2c.background || "#fafafa",
    showStatusBarBackground: v_036b39 = false,
    statusBarBackgroundColor: v_e72fb6 = '#FFFFFF',
}) => {
    const v_033e14 = v_e0068c();

    const v_f9771e = v_c18c22(0);

    const v_acf836 =
        v_326be8.OS === 'ios'
            ? v_033e14.bottom
            : Math.max(v_f9771e, v_033e14.bottom);

    const v_cebf7c = v_acf836 + v_86fc47;
    const v_cb21f8 = v_700696.get('window').height;

    return (
        <View style={[v_d81136.wrapper, v_7fa4e4]}>
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
            <View
                style={[
                    v_d81136.container,
                    {
                        height: v_cb21f8,
                        backgroundColor: v_f7b9fb,

                        paddingBottom: v_bb8530 ? v_cebf7c : 0,
                    }
                ]}
            >
                {v_21f619}
            </View>
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
};

const v_d81136 = v_472849.create({
    wrapper: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
    },
    container: {
        flex: 1,
        position: 'relative',
        overflow: 'visible',
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

export default v_556baf;

