import { rabbitPub, rabbitSub } from '../src/lib/rabbit'

describe('[Unit] - RMQ Broker', () => {
    jest.resetModules();
    const topic: string = '_u_test'
    const value: Object = { message: ['test message'], date: new Date() }

    // it('should send value rmq server', async () => {
    //     await rabbitPub(value, topic).catch(e => { throw e })
    // })

    it('should get value rmq server', async () => {
        await rabbitSub(topic, (res: any) => {
            console.log(`res => `, res)
        }).catch(e => { throw e })
    })
});
