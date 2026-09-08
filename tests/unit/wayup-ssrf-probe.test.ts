import { describe, expect, it } from 'vitest'
import { assertSafeUrl, parseAddress, isBlockedAddress } from '@/lib/wayup/security'

const blocked = (raw: string) => {
  try {
    assertSafeUrl(raw)
    return false
  } catch {
    return true
  }
}

/**
 * Written independently of `wayup-security.test.ts`, against the module's public surface only.
 * Its job is to disagree: the two suites were authored separately so that a shared assumption
 * about what a URL means has somewhere to surface. This one found that `http://localhost/`
 * passed `assertSafeUrl` and was refused only later, at the DNS stage.
 */
describe('an independent look at the SSRF guard', () => {
  it('blocks the classic bypass zoo', () => {
    const attacks = [
      'http://127.0.0.1/',
      'http://127.1/',
      'http://2130706433/',
      'http://0177.0.0.1/',
      'http://0x7f.0.0.1/',
      'http://0x7f000001/',
      'http://[::1]/',
      'http://[::ffff:127.0.0.1]/',
      'http://[::ffff:7f00:1]/',
      'http://[0:0:0:0:0:ffff:127.0.0.1]/',
      'http://169.254.169.254/latest/meta-data/',
      'http://metadata.google.internal/',
      'http://[fd00:ec2::254]/',
      'http://10.0.0.1/',
      'http://192.168.1.1/',
      'http://172.16.0.1/',
      'http://100.64.0.1/',
      'http://[fc00::1]/',
      'http://[fe80::1]/',
      'http://0.0.0.0/',
      'http://255.255.255.255/',
      'http://[64:ff9b::7f00:1]/',
      'file:///etc/passwd',
      'data:text/html,<script>1</script>',
      'javascript:alert(1)',
      'gopher://127.0.0.1:11211/',
      'ftp://127.0.0.1/',
      'blob:http://x/y',
      'http://user:pass@example.com/',
      'http://localhost/',
      'http://LOCALHOST/',
      'http://127.0.0.1.:80/',
      'http://[::]/',
    ]
    const allowed = attacks.filter((a) => !blocked(a))
    expect(allowed, `these got through:\n${allowed.join('\n')}`).toEqual([])
  })

  it('still allows an ordinary public URL', () => {
    for (const ok of [
      'https://example.com/a',
      'http://93.184.216.34/',
      'https://sub.example.co.uk/x?y=1',
    ]) {
      expect(blocked(ok), ok).toBe(false)
    }
  })

  it('does not disagree with the URL parser about a literal', () => {
    // Two parsers reading one address differently is the shape of an SSRF bypass.
    for (const host of ['09.0.0.1', '010.0.0.1', '1.1.1.01', '999.1.1.1', '1.2.3.4.5']) {
      let whatwg: string | null = null
      try {
        whatwg = new URL(`http://${host}/`).hostname
      } catch {
        whatwg = null
      }
      const ours = parseAddress(host)
      if (whatwg === null) {
        // The URL parser refuses it, so assertSafeUrl must too.
        expect(blocked(`http://${host}/`), host).toBe(true)
      } else if (ours) {
        // Both parsed it; they must agree on whether it is private.
        const viaWhatwg = parseAddress(whatwg)
        expect(viaWhatwg && isBlockedAddress(viaWhatwg), host).toBe(isBlockedAddress(ours))
      }
    }
  })
})
