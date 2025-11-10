import { account } from "@/src/appwrite/client";
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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await account.createEmailSession(email, password);
      router.replace("/");
    } catch (error) {
      Alert.alert("Помилка авторизації", "Невірна пошта або пароль");
    }
  };

  return (
    <ImageBackground
      source={require("@/assets/images/bg_login-register.png")}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Увійти до TaskFlow</Text>

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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Увійти</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/register")}>
          <Text style={styles.linkText}>
            Ще не маєте акаунту? <Text style={styles.linkBold}>Створити</Text>
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
    backgroundColor: "#2563eb",
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
