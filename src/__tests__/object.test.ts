import { StringObj } from '../object'

describe('hash keys', () => {
  it('should hash strings with the same content differently', () => {
    const input = 'Hello World'
    const input2 = 'something else'

    const hello = new StringObj(input)
    const hello2 = new StringObj(input)

    const other = new StringObj(input2)
    const other2 = new StringObj(input2)

    expect(hello.hashKey()).toEqual(hello2.hashKey())
    expect(other.hashKey()).toEqual(other2.hashKey())
    expect(hello.hashKey()).not.toEqual(other.hashKey())
  })
})
