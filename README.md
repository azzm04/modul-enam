# IOTWatch - IoT Temperature Monitoring & Control System

IOTWatch adalah sistem monitoring dan kontrol suhu IoT real-time yang mengintegrasikan aplikasi mobile React Native, backend Node.js, MQTT broker, dan Expo push notifications. Sistem ini memungkinkan pengguna untuk memantau suhu sensor, mengatur threshold, menerima notifikasi real-time, dan mengontrol perangkat dari aplikasi mobile.

📋 Daftar Isi
- [Fitur Utama](#fitur-utama)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Proyek](#menjalankan-proyek)
- [Konfigurasi Environment](#konfigurasi-environment)

✨ Fitur Utama

- **Real-time Monitoring**: Pantau data suhu dari multiple sensor via MQTT
- **Threshold Management**: Atur dan kelola threshold suhu dinamis
- **Push Notifications**: Terima alert notifikasi saat suhu melampaui threshold
- **User Authentication**: Login/Register dengan Supabase Auth
- **Device Control**: Kontrol perangkat IoT dari aplikasi mobile
- **Sensor Simulator**: Simulator IoT untuk testing tanpa hardware fisik
- **Responsive UI**: Interface mobile modern dengan React Native + Expo


📦 Instalasi & Setup

### Prerequisites
- **Node.js** >= 14.x dan **npm** >= 6.x
- **Expo CLI** (untuk menjalankan app mobile)
- **Git** (untuk clone repository)
- **Android Studio / Xcode** (opsional, untuk emulator native)
- **Supabase account** (untuk database & auth)

1️⃣ Clone Repository
```bash
git clone https://github.com/azzm04/modul-enam.git
cd modul-enam
```


2️⃣ Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi Supabase dan API key Anda
```
File .env backend harus berisi:
```bash
EXPO_PUBLIC_SUPABASE_URL=SUPABASE URL here
EXPO_PUBLIC_SERVICE_ROLE_KEY=SUPABASE SERVICE ROLE KEY here
EXPO_PUSH_TOKEN=ExponentPushToken[YourPushTokenHere]
DEVICE_API_KEY=change_this_to_a_random_secret
PORT=5000
```

3️⃣ Setup Sensor Simulator
```bash
cd ../sensor-simulator

# Install dependencies
npm install
npm install node-fetch dotenv

# Setup environment variables
cp .env.example .env
# Edit .env sesuai konfigurasi
```

File .env sensor-simulator harus berisi:
```bash
EXPO_PUBLIC_SUPABASE_URL=SUPABASE URL here
EXPO_PUBLIC_SERVICE_ROLE_KEY=SUPABASE SERVICE ROLE KEY here
EXPO_PUSH_TOKEN=ExponentPushToken[YourPushTokenHere]
DEVICE_API_KEY=change_this_to_a_random_secret
PORT=5000
```

4️⃣ Setup Mobile App (Expo)
```bash
cd ../app

# Install dependencies
npm install
npm install expo-notifications expo-device expo-constants

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi backend URL
```
File .env app harus berisi:
```
EXPO_PUBLIC_SUPABASE_URL=SUPABASE URL here
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUPABASE ANON KEY here
EXPO_PUSH_TOKEN=ExponentPushToken[YourPushTokenHere]
EXPO_PUBLIC_API_URL=http://localhost:5000 // your backend URL here
```

File app.json harus mengandung:
```bash
{
  "expo": {
    "projectId": "DoPwVLGiDwAfdEeJJsVPTx",
    "name": "IOTWatch",
    ...
  }
}
```

🚀 Menjalankan Proyek
Cara 1: Development Mode (Recommended untuk testing)
Terminal 1 - Jalankan Backend:
```bash
cd backend
npm run dev
# Backend akan berjalan di http://localhost:5000
```

Terminal 2 - Jalankan Sensor Simulator:
```bash
cd sensor-simulator
npm start
# atau: node index.js
```

Terminal 3 - Jalankan Mobile App (Expo):
```bash
cd app
npx expo start

# Opsi:
# - Tekan 'i' untuk membuka di iOS Simulator
# - Tekan 'a' untuk membuka di Android Emulator
# - Scan QR code dengan aplikasi Expo Go di perangkat fisik
```

<img width="929" height="769" alt="image" src="https://github.com/user-attachments/assets/30c1d858-a8bb-493a-9dbb-543091bc8ba8" />


Mendapatkan Supabase Credentials
Buka supabase.com
Login atau buat project baru
Di Project Settings → API, copy:
Project URL → SUPABASE_URL
anon public key → SUPABASE_ANON_KEY
service_role secret → SUPABASE_SERVICE_ROLE_KEY (jangan share!)


Mendapatkan Expo Project ID
```bash
cd app
# Jika belum ada:
npx expo build:configure
# atau
eas project:init

# Project ID akan di-generate dan disimpan di app.json
```






