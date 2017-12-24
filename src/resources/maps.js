import setup from '../core/services/setup'

const maps = {
  name: 'maps',
  path: '/maps',
  schema: {
    text: { type: String, required: true }
  }
}

export default function (backend) {
  return function (app) {
    setup(app, maps, backend)
  }
}
