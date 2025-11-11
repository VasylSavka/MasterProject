import { account } from "@/src/appwrite/client";
import { ID } from "appwrite";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  ImageBackground,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await account.create(ID.unique(), email, password, name);
      const fn: any =
        (account as any).createEmailPasswordSession ||
        (account as any).createEmailSession;
      await fn.call(account, email, password);
      router.replace("/dashboard");
    } catch (error) {
      Alert.alert("Помилка реєстрації", "Спробуйте ще раз або змініть дані");
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bg_login-register.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Створити акаунт</Text>

        <TextInput
          style={styles.input}
          placeholder="Ім'я"
          placeholderTextColor="#ccc"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Електронна пошта"
          placeholderTextColor="#ccc"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Пароль"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Зареєструватися</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/login")}>
          <Text style={styles.linkText}>
            Вже маєте акаунт? <Text style={styles.linkBold}>Увійти</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    margin: 16,
    borderRadius: 16,
  },
  title: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1f2937",
    color: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  linkText: {
    color: "#ccc",
    textAlign: "center",
  },
  linkBold: {
    color: "#fff",
    fontWeight: "bold",
  },
});
