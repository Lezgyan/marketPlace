import api from '../Api';

export const loginUser = async (credentials: { username: string; password: string }) => {

    try {
        const response = await api.post('/auth/login', credentials);
        return response.data; 
    } catch (err: any) {
        throw err; 
    }
};