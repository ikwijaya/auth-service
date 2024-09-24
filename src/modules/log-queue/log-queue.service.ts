import { rabbitPub, rabbitSub } from '@/lib/rabbit'
import { IApiError } from '@/lib/errors'

export default class LogQueueService {
    
    /**
     * 
     * @param value 
     * @param topic 
     */
    async publisher(value: Object, topic: string) {
        const msgBrokerType: string = process.env.MSG_BROKER_TYPE

        if (msgBrokerType === 'rmq') await rabbitPub(value, topic).catch(e => { throw e })
        else throw { rawErrors: ["Queue type is not supported"], statusCode: 401 } as IApiError
    }
}