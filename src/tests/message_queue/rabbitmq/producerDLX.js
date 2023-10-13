const amqp = require("amqplib");
const messages = "hello, Rabbit MQ for Tips JS";

const log = console.log;

console.log = function () {
  log.apply(console, [new Date()].concat(arguments));
};

const runProducer = async () => {
  try {
    const connection = await amqp.connect("amqp://guest:guest@localhost");
    const channel = await connection.createChannel();

    const notificationExchange = "notificationEx"; //notification direct
    const notiQueue = "notificationQueueProcess"; // assertQueue
    const notificationExchangeDLX = "notificationExDLX"; //notification direct
    const notificationRoutingKeyDLX = "notificationRoutingKeyDLX";

    //1.create Exchange
    await channel.assertExchange(notificationExchange, "direct", {
      durable: true,
    });

    //2. create Queue
    const queueResult = await channel.assertQueue(notiQueue, {
      exclusive: false, // cho phep cac ket noi truy cap vao cung mot luc hang doi
      deadLetterExchange: notificationExchangeDLX,
      deadLetterRoutingKey: notificationRoutingKeyDLX,
    });

    //3.bindQueue
    await channel.bindQueue(queueResult.queue, notificationExchange);

    //4. Send Message
    const msg = "a new product";
    await channel.sendToQueue(queueResult.queue, Buffer.from(msg), {
      expiration: "10000",
    });

    setTimeout(() => {
      connection.close();
      process.exit(0);
    }, 500);
  } catch (error) {
    console.error(error);
  }
};

runProducer().catch(console.error);
