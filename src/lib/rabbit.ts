import amq from 'amqplib';
import logger from './logger';

export interface IPub {
  queue: string;
  value: string;
  durable: boolean;
  ms: number;
  attempt?: number;
}

/**
 *
 * @param value
 */
export async function rabbitPub(value: Object, topic: string) {
  let connection: any;

  try {
    const content: string = JSON.stringify(value);
    let i: number = 0;

    const CSTRING = process.env.MSG_BROKER_URL;
    async function run(msg?: any) {
      logger.info(msg);
      await amq
        .connect(CSTRING)
        .then(async (_con: amq.Connection) => {
          _con.on('error', function (err) {
            setTimeout(async (err) => {
              await run(err);
            }, 500);
          });
          const channel: amq.Channel = await _con
            .createConfirmChannel()
            .catch((e) => {
              throw e;
            });
          await channel
            .assertQueue(topic, { durable: true } as amq.Options.AssertExchange)
            .then(async () => {
              channel.sendToQueue(topic, Buffer.from(content), {
                persistent: true,
              } as amq.Options.Publish);
              await _con.close().then(async () => {
                await _con.close();
              });
            })
            .catch((e) => {
              throw e;
            });
        })
        .catch((e) => {
          i++;
          if (i < 5)
            setTimeout(async () => {
              await run(e);
            }, 500);
          else logger.error(`force close, ${i}x attempt`);
        });
    }

    connection = await run('running at ' + new Date());
  } catch (error) {
    throw error;
  } finally {
    if (connection) await connection.close();
  }
}

interface ISub {
  queue: string;
  durable: boolean;
  ms: number;
  attempt?: number;
}

/**
 *
 * @param value
 */
export async function rabbitSub(topic: string, callback: Function) {
  try {
    const i: number = 0;
    const CSTRING = process.env.MSG_BROKER_URL;
    async function run(msg?: any) {
      logger.info(msg);
      return await amq
        .connect(CSTRING + '?hearbeat=60')
        .then(async (_con: amq.Connection) => {
          _con.on('error', function (err) {
            setTimeout(async () => await run(err), 10000);
          });
          _con.on('close', function () {
            setTimeout(async () => await run(), 10000);
          });

          const channel: amq.Channel = await _con.createChannel();
          return await channel
            .assertQueue(topic, { durable: true } as amq.Options.AssertExchange)
            .then(async () => {
              return await channel.consume(
                topic,
                (_: amq.ConsumeMessage) => {
                  callback(
                    {
                      content: _.content.toString(),
                      properties: _.properties,
                      fields: _.fields,
                    },
                    channel,
                    _
                  );
                },
                {
                  noAck: true,
                }
              );
            });
        })
        .catch((e) => {
          const attempt: number = 5;
          if (attempt && attempt !== 0) {
            if (i < attempt)
              setTimeout(async () => await run(e), 500);
            else logger.error(`force close by (${attempt}) attempt!`);
          } else setTimeout(async () => await run(e), 500);
        });
    }

    return await run('running at ' + new Date());
  } catch (error) {
    throw error;
  }
}
