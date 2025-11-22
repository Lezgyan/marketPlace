import api from '../Api'

interface RegisterPayload {
    username: string;
    email: string;
    password: string;
}

export const registerUser = async (payload: RegisterPayload) => {
    try {
        const response = await api.post('/auth/register', payload);
        return response.data
    } catch (error) {
        throw error
    }
};