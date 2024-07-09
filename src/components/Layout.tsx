import { Flex, View } from "@adobe/react-spectrum";

export const Layout = ({ children }) => (
  <View height="100vh" backgroundColor="blue-400">
    <Flex direction="column" gap="size-100">
      <View padding="size-100">{children}</View>
    </Flex>
  </View>
);
