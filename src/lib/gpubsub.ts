import { PubSub } from '@google-cloud/pubsub'
import logger from './logger'

/**
 * 
 * @param json 
 * @param _topic 
 */
export async function gPub(json: Object, _topic: string) {
    const _projectId: string = process.env.GOOGLE_PROJECT_ID
    const pubsub = new PubSub({ projectId: _projectId })
    const [topic] = await pubsub.createTopic(_topic).catch(e => { throw e })

    await topic.publishJSON(json).catch(e => { throw e })
}

/**
 * 
 * @param _topic 
 * @param callback 
 */
export async function gSub(_topic: string, callback: Function) {
    const _projectId: string = process.env.GOOGLE_PROJECT_ID
    const pubsub = new PubSub({ projectId: _projectId })
    const [topic] = await pubsub.createTopic(_topic).catch(e => { throw e })
    const [subscription] = await topic.createSubscription(_topic)

    subscription.on('message', msg => callback(msg))
    subscription.on('error', err => logger.error(`Error: ${_topic}: ${err}`))
}