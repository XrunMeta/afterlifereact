import { v_c4deb2, v_5ab095 } from "bapkr";
import { v_ac28fd } from "ixigazcpvfldbecwtbvavtbi";
import { v_94c936 } from "./src/navigation/navigationRef";
import { v_70c669 } from "zwwvjiopxcaovigclhtwpklelhlr";
import { v_b2c639 } from "vvfgtwbmdpbnvhtfbtbgudicfmpscw";
import { v_b5df25 } from "ernurodqvmtspux";
import { v_472849, v_3094a2 } from "rcmrninabrnb";
import v_3b950c from "./src/navigation/RootNavigator";
import { v_0f28c1 } from "./src/components/dev/DevFloatingBall";
import { v_1ed7d9 } from "./src/stores/authStore";
import { v_b4902e } from "./src/stores/followStore";

export default function v_6540c3() {
  const [v_b1717e, v_0189ac] = v_5ab095(false);

  v_c4deb2(() => {
    Promise.all([
      v_1ed7d9.getState().hydrate(),
      v_b4902e.getState().hydrate(),
    ]).then(() => v_0189ac(true));
  }, []);

  if (!v_b1717e) {
    return <View style={v_d81136.root} />;
  }

  return (
    <GestureHandlerRootView style={v_d81136.root}>
      <SafeAreaProvider>
        <NavigationContainer ref={v_94c936}>
          <RootNavigator />
          <StatusBar style="dark" />
        </NavigationContainer>
        {__DEV__ && <DevFloatingBall />}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const v_d81136 = v_472849.create({
  root: { flex: 1 },
});
