const mqtt = require('mqtt')
const _ = require('lodash')
const logging = require('homeautomation-js-lib/logging.js')
const interval = require('interval-promise')
const health = require('homeautomation-js-lib/health.js')
const request = require('request')
const mqtt_helpers = require('homeautomation-js-lib/mqtt_helpers.js')
const snmp = require('snmp-native')
const queryInterval = 60
const updateTimer = 5


// Config
const topic_prefix = process.env.TOPIC_PREFIX
const cyberpower_ip = process.env.CYBERPOWER_IP
const cyberpower_port = process.env.CYBERPOWER_PORT
const cyberpower_community = process.env.CYBERPOWER_COMMUNITY
const nameWalkBase = '.1.3.6.1.4.1.3808.1.1.3.3.3.1.1.2.'
const statusWalkBase = '.1.3.6.1.4.1.3808.1.1.3.3.3.1.1.4.'
const numberOfOutlets = 8


if (_.isNil(topic_prefix)) {
    logging.warn('TOPIC_PREFIX not set, not starting')
    process.abort()
}

var mqttOptions = { qos: 1 }

var shouldRetain = process.env.MQTT_RETAIN

if (_.isNil(shouldRetain)) {
    shouldRetain = true
}

mqttOptions['retain'] = shouldRetain

var connectedEvent = function() {
    health.healthyEvent()

    const topics = [topic_prefix + '/+/set']

    logging.info('Connected, subscribing ')
    topics.forEach(function(topic) {
        logging.info(' => Subscribing to: ' + topic)
        client.subscribe(topic, { qos: 1 })
    }, this)
}

var disconnectedEvent = function() {
    health.unhealthyEvent()
}

const client = mqtt_helpers.setupClient(connectedEvent, disconnectedEvent)
const session = new snmp.Session({ host: cyberpower_ip, port: cyberpower_port, community: cyberpower_community })

client.on('message', (topic, message) => {
    logging.info(' ' + topic + ':' + message, {
        topic: topic,
        value: message
    })

    if (topic.indexOf('/set') >= 0) {
        const components = topic.split('/')
        const name = components[components.length - 2]
        logging.debug('name: ' + name)
        setOutlet(name, message)
    }
})

var nameMap = {}

const setOutlet = function(name, on) {
    const translatedName = mqtt_helpers.generateTopic(name)
    const index = nameMap[translatedName]
    const statusOID = statusWalkBase + index.toString()

    if (index < 1)
        return

    const snmpValue = on == '1' ? 1 : 2

    session.set({ oid: statusOID, value: snmpValue, type: 2 }, function(error, varbind) {
        if (error) {
            logging.error('Failed to set: ' + snmpValue + ' on: ' + statusOID);
        } else {
            logging.info('Set ' + statusOID + ' to: ' + snmpValue);
            client.smartPublish(topic_prefix + '/' + translatedName, snmpValue == 2 ? '0' : '1', mqttOptions)
        }
    });
}


const queryOutlets = function() {
    logging.info('queryOutlets')
    for (let index = 1; index <= numberOfOutlets; index++) {
        const nameOID = nameWalkBase + index.toString()
        const statusOID = statusWalkBase + index.toString()

        session.get({ oid: nameOID }, function(nameError, varbinds) {
            var name = null
            var status = null

            if (nameError) {
                // If there is an error, such as an SNMP timeout, we'll end up here.
                logging.error('name error: ' + nameError)
            } else {
                name = varbinds[0].value
                nameMap[mqtt_helpers.generateTopic(name)] = index

                session.get({ oid: statusOID }, function(statusError, varbinds) {

                    if (statusError) {
                        // If there is an error, such as an SNMP timeout, we'll end up here.
                        logging.error('status error: ' + statusError)
                    } else {
                        status = varbinds[0].value
                        logging.debug('status for ' + name + ' is "' + status + '"')


                        client.smartPublish(topic_prefix + '/' + name, status == 2 ? '0' : '1', mqttOptions)
                    }
                })
            }
        })
    }
}

const startHostCheck = function() {
    logging.info('Starting to monitor: ' + cyberpower_ip)
    queryOutlets()

    interval(async() => {
        queryOutlets()
    }, queryInterval * 1000)
}

startHostCheck()