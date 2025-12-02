import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Dimensions, FlatList, Image, Modal, StyleSheet, Text, TextInput, ToastAndroid, TouchableOpacity, View } from 'react-native';
import Input from '../components/ui/Input';
import { addAccount, deleteAccount, generateCode, getAccounts, searchAcc, updateAccount } from "../services/AuthenticatorService";
import PasswordUtils from '../utils/PasswordUtils';
export default function AuthenticatorScreen() {
  const [accounts, setAccounts] = useState([]);
  const router = useRouter();
   const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [secret, setSecret] = useState('');
  const [isPasswordVisible, SetisPasswordVisible] = useState({});
  const progress = useRef(new Animated.Value(1)).current; // 1 → full width
const screenWidth = Dimensions.get('window').width;
const [editModalVisible, setEditModalVisible] = useState(false);
const [editName, setEditName] = useState('');
const [editSecret, setEditSecret] = useState('');
const [editIndex, setEditIndex] = useState(null);
const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
    loadAccounts();// seconds
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = now % 30;
      const remaining = 30 - elapsed;

      // Refresh codes based on real time
      setAccounts(prev =>
        prev.map(acc => ({
          ...acc,
          
          code: generateCode(acc.secret) ?? "",
        }))
      );

      // When the code resets (remaining === period), restart animation
      if (remaining === 30) {
        startProgressAnimation();
      }
    }, 1000);

    // Start initial animation
    startProgressAnimation();
    return () => clearInterval(interval);
  }, []);
    const handleSearch = async (query) => {
    setSearchQuery(query);
      try {
        const searchResults = await searchAcc(query);
        setAccounts(searchResults);
      } catch (error) {
        console.error('Error searching passwords:', error);
          }
  };
  const openEditModal = (account, index) => {
  setEditName(account.name);
  setEditSecret(account.secret);
  setEditIndex(index);
  setEditModalVisible(true);
};
const handleUpdateAccount = async () => {
  if (editIndex === null) return;
  try {
    const updatedAccounts = [...accounts];
    updatedAccounts[editIndex] = {
      ...updatedAccounts[editIndex],
      name: editName,
      secret: editSecret,
    };
    await updateAccount(editIndex,editName, editSecret); // Optional: if you want to persist
    setAccounts(updatedAccounts);
    Alert.alert('Account Updated', `${editName} updated successfully!`);
  } catch (error) {
    Alert.alert('Error', error.message);
  }
  setEditModalVisible(false);
};

   const handleAddAccount = async() => {
    if (!name || !secret) return;
    try {
     await addAccount(name,secret)
     Alert.alert("Account Added", `${name} added successfully!`);
     loadAccounts();
    } catch (error) {
       Alert.alert("Error parsing QR", error.message);
    }
    setName('');
    setSecret('');
    setModalVisible(false);
  };

  const startProgressAnimation = () => {
    progress.setValue(1); // reset full bar
    Animated.timing(progress, {
      toValue: 0,
      duration: 30 * 1000, // smooth shrink over full cycle
      useNativeDriver: false,
    }).start();
  };

  const animatedWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, screenWidth],
  });

  async function loadAccounts() {
    const list = await getAccounts();
    const updated = list.map(acc => ({
      ...acc,
      period: 30,
      remaining: 30,
      code: generateCode(acc.secret) ?? "",
    }));
    setAccounts(updated);
    // resetAllAccounts();
  }
               
 const handlePasswordShow = (index) => {
  SetisPasswordVisible((prev) => ({
    ...prev,
    [index]: !prev[index], // toggle true/false
  }));
};
   const formatPassword = (pass,id) => {
      if (isPasswordVisible[id]) {
        return pass;
      }
      return PasswordUtils.maskPassword(pass, 0);
    };
  async function handleDelete(index) {
    await deleteAccount(index);
    loadAccounts();
  }
   const copyToClipboard = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      // You could add a toast notification here
      ToastAndroid.show("Code Copied",10);
    } catch (error) {
      console.log(error.message);
      
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  return (<View style={{backgroundColor: "#f4f4f4ff" ,height : "100%"}}>
  
    <View style={{ display : "flex",alignItems : "center",flexDirection : "row",justifyContent : "start", marginTop : "30",backgroundColor : "white",position : "fixed",top : 0,width : "100%",padding : 6,paddingInline : 30}}>
         <Image  source={require('../assets/images/top.png')} style={{width : 40,height : 40}}/>
           <Text style={{ color: "#6c6c6c", fontSize: 18,  marginTop: 0,padding : 16,fontWeight : "800",textAlign : "center" }}>Credo Manager</Text></View>
        
        <View style={{marginTop : 10}}>
              <Input
                placeholder="Search passwords..."
                value={searchQuery}
                onChangeText={handleSearch}
                rightIcon="search"
                style={{backgroundColor :  Colors.light.surface}}
              />
            </View>
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f4f4f4ff" }}>
     <Animated.View style={[styles.progressBar, { width: animatedWidth }]} />
      <FlatList
        data={accounts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => {
const colors = ["#F44336", "#E91E63", "#9C27B0", "#3F51B5", "#03A9F4", "#009688", "#4CAF50", "#FFC107", "#FF9800", "#795548"];
const firstChar = item.name?.[0] ?? "?"; // fallback if name is missing
const colorIndex = firstChar.charCodeAt(0) % colors.length;
const bgColor = colors[colorIndex];
          return (
            <View style={{
              padding: 4,
              paddingInline : "10",
              marginBottom: 10,
              borderRadius: 6,
              backgroundColor: "white",
              display : "flex",
              flexDirection : "row",
              alignItems : "center",
              gap: 20,
              justifyContent : "space-between",
              position :"relative"
              
            }}  >
              <View style={{display  : "flex",flexDirection : "row",gap : 10,alignItems : "center",justifyContent : "center"}}>
              <View style={{backgroundColor : bgColor,height:"40",width:"40",  borderRadius : "100%",display:"flex" ,justifyContent:"center"}}><Text style={{color : "white",fontWeight : "bold",textAlign:"center",textTransform : "capitalize"}}>{item.name[0]}</Text></View>
              <TouchableOpacity activeOpacity={0.8} onPress={()=>handlePasswordShow(index)} style={{display : "flex",justifyContent : "center",maxHeight:120,minHeight:60,gap : "2"}}>
              <Text style={{ color : "black" , fontWeight : 500 , fontSize : 13,color: "black"}}>{item.name}</Text>
              {isPasswordVisible[index] && 
              <Text style={{ color : "#2e82ff" , fontWeight : 600 , fontSize : 16 ,Height : 40}}>{formatPassword(item.code,index).slice(0,3)}  {formatPassword(item.code,index).slice(3,)}</Text>
              }
              {!isPasswordVisible[index] && <View style={{display : "flex",flexDirection : "row",gap : 4,Height : 20,minHeight : "20",justifyContent :"center",alignItems : "center"}}>
                <FontAwesome name="circle" size={12} color="gray" />
                <FontAwesome name="circle" size={12} color="gray" />
                <FontAwesome name="circle" size={12} color="gray" />
                <FontAwesome name="circle" size={12} color="gray" style={{marginLeft : "10"}} />
                <FontAwesome name="circle" size={12} color="gray" />
                <FontAwesome name="circle" size={12} color="gray" />
              </View>
              }
              
              </TouchableOpacity>
              </View>
             
                <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => openEditModal(item, index)}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="pencil" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
<Ionicons name='copy-outline' onPress={()=>copyToClipboard(item.code)}  size={18} style={{color : "black"}}  />
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              'Delete Password',
              'Are you sure you want to delete this?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: ()=>handleDelete() },
              ]
            );
          }}
          style={styles.actionButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
        </TouchableOpacity>
      </View>
                </View>
            
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/ScanAndAddScreen")}
        activeOpacity={0.8}
      >
        <Ionicons name="scan-outline" size={20} color={"black"} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.fabMAnual}
         onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="black" />
      </TouchableOpacity>
       <Modal
        visible={modalVisible}
        backdropColor={"white"}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Account</Text>

            <TextInput
              placeholder="Account Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              placeholder="Secret"
              value={secret}
              onChangeText={setSecret}
              style={styles.input}
            />

            <View style={styles.buttonsRow}>
              <TouchableOpacity activeOpacity={0.8} style={{width : "45%", height : "40",borderRadius : 8,backgroundColor : "#D9E2FF",display:"flex" ,alignItems : "center",justifyContent:"center"}} onPress={() => setModalVisible(false)} ><Text style={{color : "black",textAlign : "center"}}>Cancel</Text> </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.8} style={{width : "45%",backgroundColor : "#008AFF",height : "40",borderRadius :8 ,display:"flex" ,alignItems : "center",justifyContent:"center"}} onPress={handleAddAccount} > <Text style={{color : "white",textAlign : "center"}}>Add</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
  visible={editModalVisible}
  animationType="slide"
  onRequestClose={() => setEditModalVisible(false)}
  transparent={true}
>
  <View style={styles.overlay}>
    <View style={styles.modalContainer}>
      <Text style={styles.modalTitle}>Edit Account</Text>

      <TextInput
        placeholder="Account Name"
        value={editName}
        onChangeText={setEditName}
        style={styles.input}
      />

      <TextInput
        placeholder="Secret"
        value={editSecret}
        onChangeText={setEditSecret}
        style={styles.input}
      />

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: "50%",
            height: 40,
            borderRadius: 8,
            backgroundColor: "#D9E2FF",
            alignItems: "center",
            justifyContent: "center"
          }}
          onPress={() => setEditModalVisible(false)}
        >
          <Text style={{ color: "black" }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={{
            width: "50%",
            height: 40,
            borderRadius: 8,
            backgroundColor: "#008AFF",
            alignItems: "center",
            justifyContent: "center"
          }}
          onPress={handleUpdateAccount}
        >
          <Text style={{ color: "white" }}>Update</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </View>
  </View>
  );
}

const styles = StyleSheet.create({
   fab: {
    position: 'absolute',
    bottom: Spacing.lg+10,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#D9E2FF",
    alignItems: 'center',
    justifyContent: 'center',
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.30,
    // shadowRadius: 4.65,
  },
   fabMAnual: {
    position: 'absolute',
    bottom: Spacing.lg+80,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#D9E2FF',
    alignItems: 'center',
    justifyContent: 'center',
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.30,
    // shadowRadius: 4.65,
  },
   container: {
    flex: 1,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#2e82ff',
    position: 'absolute',
    top: 0,
    left: 0,
  },
    modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap :"10%",
    width : "99%"
   
  },
   actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginHorizontal: Spacing.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 16,
  },
 
});
