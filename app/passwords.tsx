import { Colors, Spacing, Typography } from '@/constants/theme';
import PasswordManagerService from '@/services/PasswordManagerService';
import { PasswordEntry } from '@/types/PasswordTypes';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { debounce } from 'lodash';
import React, { useCallback, useRef, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PasswordCard from '../components/ui/PasswordCard';
import SecureStorageService from '../services/SecureStorageService';
interface PasswordListScreenProps {
  navigation: any;
}

export default function PasswordListScreen({  }: PasswordListScreenProps) {
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [filteredPasswords, setFilteredPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const searchRef = useRef('');
  useFocusEffect(
    useCallback(() => {
      loadPasswords();
      console.log(passwords);
      
    }, [])
  );
const [visiblePasswords, setVisiblePasswords] = useState<PasswordEntry[]>([]);

const updateSearchResults = useCallback(
  debounce(async (query : string) => {
    if (!query.trim()) {
      setVisiblePasswords(passwords);
      return;
    }
    try {
      const results = await PasswordManagerService.searchPasswords(query);
      setVisiblePasswords(results);
    } catch (err) {
      console.error('Error searching:', err);
    }
  }, 2000),
  [passwords]
);
const handleExport = async () => {
  try {
    const jsonData = await SecureStorageService.exportPasswords();
    if (!jsonData) {
      Alert.alert('Export Failed', 'No passwords found or export error.');
      return;
    }

    // Create the target file in the document directory
    const file = new File(Paths.document, 'passwords_backup.json');

    // Write JSON to the file
    await file.write(jsonData, { encoding: 'utf8' });

    // Share or alert file location
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    } else {
      Alert.alert('Backup Saved', `File saved to:\n${file.uri}`);
    }
  } catch (error) {
    console.error('Error exporting passwords:', error);
    Alert.alert('Error', 'Failed to export passwords.');
  }
};
async function handleImport() {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
    });

    if (result.canceled || !result.assets?.length) return;

    const fileUri = result.assets[0].uri;

    // ✅ Create a File instance and read its content as text
    const file = new File(fileUri);
    const jsonData = await file.text(); // <-- this replaces .read()

    const success = await SecureStorageService.importPasswords(jsonData);

    if (success) {
      Alert.alert('✅ Success', 'Passwords imported successfully!');
      loadPasswords();
    } else {
      Alert.alert('❌ Failed', 'Unable to import passwords.');
    }
  } catch (error) {
    console.error('Error importing passwords:', error);
    Alert.alert('Error', `Failed to import passwords: ${error.message}`);
  }
}


const handleSearch = (query: string) => {
  searchRef.current = query; // won’t cause re-render
  updateSearchResults(query);
};
  const loadPasswords = async () => {
    try {
      setIsLoading(true);
      const passwordList = await PasswordManagerService.getPasswords();
      setPasswords(passwordList);
      setFilteredPasswords(passwordList);
      setVisiblePasswords(passwordList);
      console.log(passwordList,"passwordList");
      
    } catch (error) {
      console.error('Error loading passwords:', error);
      Alert.alert('Error', 'Failed to load passwords');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPasswords();
    setIsRefreshing(false);
  };

  // const handleSearch = async (query: string) => {
  //   // setSearchQuery(query);
  //     countRef.current = query
  //   if (query.trim() === '') {
  //     setFilteredPasswords(passwords);
  //     filterpass.current = passwords
  //   } else {
  //     try {
  //       const searchResults = await PasswordManagerService.searchPasswords(query);
  //       filterpass.current = searchResults;
  //     } catch (error) {
  //       console.error('Error searching passwords:', error);
        
  //     }
  //   }
  // };

  const handlePasswordPress = (password: PasswordEntry) => {
     router.push({
    pathname: './password-detail',
    params: { password: JSON.stringify(password) },
  });
}

  const handleEditPassword = (password: PasswordEntry) => {
     router.push({
    pathname: './add-edit-password',
    params: {  password: JSON.stringify(password) , mode: 'edit' },
  });
}
  const handleDeletePassword = async (passwordId: string) => {
    try {
      const success = await PasswordManagerService.deletePassword(passwordId);
      if (success) {
        await loadPasswords();
        Alert.alert('Success', 'Password deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete password');
      }
    } catch (error) {
      console.error('Error deleting password:', error);
      Alert.alert('Error', 'Failed to delete password');
    }
  };

  const handleAddPassword = () => {
   router.push({
    pathname: './add-edit-password',
    params: { mode: 'add' },
  });
}
  const handleAuthenticator = () => {
   router.push({
    pathname: './AuthenticatorScreen',
    params: { mode: 'add' },
  });
}

  const renderPasswordCard = ({ item }: { item: PasswordEntry }) => (
    <PasswordCard
      password={item}
      onPress={() => handlePasswordPress(item)}
      onEdit={() => handleEditPassword(item)}
      onDelete={() => handleDeletePassword(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
        <Image  source={require('../assets/images/top.png')} style={{width : 80,height : 80}}/>
      <Text style={styles.emptyTitle}>No Passwords Yet</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'No passwords match your search' 
          : 'Add your first password to get started'
        }
      </Text>
      {!searchQuery && (
        <Button
          title="Add Password"
          onPress={handleAddPassword}
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  const renderHeader = () => (
  
   
    <View style={styles.header}>
      
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search passwords..."
          value={searchQuery}
          onChangeText={handleSearch}
          rightIcon="search"
          style={styles.searchInput}
          onRightIconPress={() => setVisiblePasswords(passwords)}
        />
      </View>
       <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0,paddingInline : 20 }}>
  <TouchableOpacity
    style={{ backgroundColor: '#D9E2FF', padding: 10, borderRadius: 8 ,width : "48%"}}
    onPress={handleExport}
  >
    <Text style={{ color: 'black',textAlign : "center" }}>Export Backup</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={{ backgroundColor: '#008AFF', padding: 10, borderRadius: 8 ,width : "48%"}}
    onPress={handleImport}
  >
    <Text style={{ color: 'white', textAlign : "center"  }}>Import Backup</Text>
  </TouchableOpacity>
</View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading passwords...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
       <View style={{ display : "flex",alignItems : "center",flexDirection : "row",justifyContent : "start", marginTop : "30",backgroundColor : "white",position : "fixed",top : 0,width : "100%",padding : 6,paddingInline : 30}}>
         <Image  source={require('../assets/images/top.png')} style={{width : 40,height : 40}}/>
           <Text style={{ color: "#6c6c6c", fontSize: 18,  marginTop: 0,padding : 16,fontWeight : "800",textAlign : "center" }}>Credo Manager</Text></View>
     

      <FlatList
        data={visiblePasswords}
        renderItem={renderPasswordCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.light.primary]}
            tintColor={Colors.light.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddPassword}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color={"black"} />
      </TouchableOpacity>
       <TouchableOpacity
        style={styles.fabAUth}
        onPress={handleAuthenticator}
        activeOpacity={0.8}
      >
        <Ionicons name="apps" size={20} color={"black"} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4ff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.secondary,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100, // Space for FAB
  },
  header: {
  },
  title: {
    ...Typography.h1,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.secondary,
    marginBottom: Spacing.lg,
  },
  searchContainer: {
    marginBottom: Spacing.md,
    width :"100%"
  },
  searchInput: {
    marginBottom: 0,
    backgroundColor :  Colors.light.surface,
    borderRadius : 12
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.light.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.light.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  emptyButton: {
    marginTop: 3,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor : "#008AFF"
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
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
  fabAUth: {
    position: 'absolute',
    bottom: Spacing.lg+70,
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
});
