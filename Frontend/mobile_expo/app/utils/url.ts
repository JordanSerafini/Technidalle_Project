import { Platform } from 'react-native';

export const url = {
    local: 'https://3f7c-2a01-cb15-11-6800-731-5a56-873d-4a32.ngrok-free.app/',
    chatbot: 'http://192.168.20.225:3000/',
    home: 'http://86.200.249.166/',
    email: Platform.OS === 'web' ? 'http://localhost:4444' : 'http://192.168.20.225:4444',
    forwarded: 'https://6796-2a01-cb15-11-6800-a0a9-8731-4a2-8988.ngrok-free.app/',
}

export default url;
