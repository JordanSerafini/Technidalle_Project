import { Platform } from 'react-native';

export const url = {
    local: 'https://37ff-2a01-cb15-11-6800-a4e-b046-f737-8707.ngrok-free.app/',
    chatbot: 'http://192.168.20.225:5599/',
    home: 'http://86.200.249.166/',
    email: Platform.OS === 'web' ? 'http://localhost:4444' : 'http://192.168.20.225:4444',
    forwarded: 'https://4dc9-2a01-cb15-11-6800-b2a7-9ce3-5d5-e4af.ngrok-free.app',
}

export default url;
