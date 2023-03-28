const { connect } = require("amqplib")
const { readdirSync } = require("fs");

require("dotenv").config();

(async() =>{
  const connection = await connect(process.env.host)
  const channel = await connection.createChannel()

  for(const FileName of readdirSync("./consumers")){
    const Callback = require("./consumers/" + FileName, "utf-8")

    await channel.assertQueue(FileName.substring(0, FileName.length - 3), {durable: true})

    channel.consume(FileName.substring(0, FileName.length - 3), Callback)
  }
})()