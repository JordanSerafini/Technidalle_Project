import { Platform } from 'react-native';

export const url = {
    local: 'http://192.168.20.225:3000/',
    chatbot: 'http://localhost:5599',
    email: Platform.OS === 'web' ? 'http://localhost:4444' : 'http://192.168.20.225:4444',
    forwarded: 'https://4dc9-2a01-cb15-11-6800-b2a7-9ce3-5d5-e4af.ngrok-free.app',
}

export default url;
