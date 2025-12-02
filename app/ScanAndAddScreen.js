import { Camera, CameraView } from "expo-camera";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, View } from "react-native";
import { addAccount } from "../services/AuthenticatorService";

export default function ScanQRScreen({  }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
const router  = useRouter()
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, []);

  const handleBarCodeScanned =async ({ type, data }) => {
    if (scanned) return;
    setScanned(true);

    try {
      if (data.startsWith("otpauth://totp/")) {
        const url = new URL(data);
        const label = decodeURIComponent(url.pathname.slice(1));
        const secret = url.searchParams.get("secret");

        if (!secret) throw new Error("No secret found in QR code");

        if (addAccount) await addAccount( label,`${secret}`);
        console.log(secret);
        
        Alert.alert("Account Added", `${label} added successfully!`);
        router.push("./AuthenticatorScreen")
      } else {
        Alert.alert("QR Code Scanned", data);
      }
    } catch (err) {
      Alert.alert("Error parsing QR", err.message);
    }
  };

  if (hasPermission === null) return <Text>Requesting camera permission...</Text>;
  if (hasPermission === false)
    return (
      <View style={styles.center}>
        <Text>Camera permission is required.</Text>
        <Button
          title="Grant Permission"
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
          }}
        />
      </View>
    );

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        isGuidanceEnabled={true}
        isHighligtingEnabled={true}
        isPinchToZoomEnabled={true}// ✅ pass handler directly
        onBarcodeScanned={(data) => {handleBarCodeScanned(data)}}
        barCodeScannerSettings={{ barCodeTypes: ["qr"] }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
