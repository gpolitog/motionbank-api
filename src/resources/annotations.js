import setup from '../core/services/setup'

const annotations = {
  name: 'annotations',
  path: '/annotations',
  schema: {
    text: { type: String, required: true }
  }
}

export default function (backend) {
  return function (app) {
    setup(app, annotations, backend)
  }
}
