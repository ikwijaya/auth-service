import { IUserAccount } from '@/dto/common.dto';
import axios from 'axios';

const baseUrl = process.env.MARKETPLACE_API_URL
const instance = axios.create({ baseURL: baseUrl })
export class MarketPlaceService {

    /**
     * 
     * @param auth 
     * @param apiKey 
     */
    public async getProjectId(auth: IUserAccount, apiKey: string) {
        return await instance
            .get('/project/' + apiKey, { headers: { token: 'Bearer ' + auth.token } })
            .then((r) => r.data as IProjectRes)
            .catch(e => { throw e })
    }
}

export interface IProjectRes {
    id: number;
    name: string;
    tierLimit: number;
}