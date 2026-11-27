# MRML network and Bluetooth administration

**Status: PLANNED.** No current claim is made for native Ethernet, Wi-Fi,
Bluetooth, persistent profiles, GUI settings, installer/recovery networking, or
physical-device support. Existing virtual-device and service evidence remains
separately labeled.

## Objects, frontends, and authority

Typed service objects include `NetworkAdapter`, `EthernetAdapter`, `WifiAdapter`,
`WifiNetwork`, `NetworkConnection`, `IpConfiguration`, `DnsConfiguration`,
`Route`, `BluetoothAdapter`, `BluetoothDevice`, `BluetoothBond`, and
`BluetoothProfile`. Shell, Network & Devices GUI, installer/recovery frontends,
automation, and capability-scoped AI use the exact same objects/services. Human
text and visual cards are views, never the configuration protocol.

Names, MAC/BSSID, SSID, device IDs, and discovery are identity/data, not authority.
Native applications normally receive bounded connections rather than system
configuration. Configuration, connection use, raw packets, promiscuous capture,
injection, monitoring, secrets, and device reset are separately authorized.

## Ethernet

Structured shell operations enumerate and enable/disable adapters; inspect/set
DHCP/static IPv4, IPv6, DNS, and routes; inspect link state/speed and interface
identity; and connect/disconnect where meaningful. Conceptual rights separate
`NETWORK_ADAPTER_READ`, `NETWORK_ADAPTER_CONFIGURE`, `NETWORK_ROUTE_MODIFY`,
`NETWORK_DNS_MODIFY`, and `NETWORK_LINK_CONTROL`. None implies `RAW_PACKET`.

Multi-value changes use a validated `NetworkConfigTransaction` so address,
prefix, gateway, routes, and DNS do not become half-configured. Risky changes may
apply as candidates with health/confirmation timeout and restoration of prior
known state. Simple safe local changes need not always use delayed commit.

## Wi-Fi

Typed operations enumerate adapters/networks, start authorized scans, connect/
disconnect, inspect connections/profiles, forget profiles, and set applicable
power policy. Results expose SSID, policy-permitted BSSID, security, signal,
frequency/band/channel, state, and saved status without text scraping.

Scanning is separate authority because nearby-network enumeration leaks location.
Passphrases, enterprise credentials, identities, certificates, and private keys
use SecretObject-style references: services receive constrained authentication/
use, not credential export, and logs/output never reveal plaintext. Enterprise
support extends these objects without embedding keys in configuration.

Privacy policy may use temporary scan identities and per-network stable randomized
MACs, with hardware MAC only when required; do not claim fingerprint resistance
without tests. Regulatory-domain and transmit rules are trusted platform policy,
not arbitrary application parameters.

## Bluetooth and input convergence

Typed operations enumerate/control adapters, scan, inspect devices, pair/reject/
unpair, connect/disconnect, and inspect profiles. Rights separate adapter read,
radio control, scan, pair, connect, bond management, and exact device/profile use.
Conceptual rights include `BLUETOOTH_ADAPTER_READ`, `BLUETOOTH_RADIO_CONTROL`,
`BLUETOOTH_SCAN`, `BLUETOOTH_PAIR`, `BLUETOOTH_CONNECT`, and
`BLUETOOTH_BOND_MANAGE`; names are not frozen ABI.
HID, audio output, audio input, BLE GATT, object transfer, and serial compatibility
remain distinct; keyboard access grants no arbitrary BLE authority.

Bond keys are secret state and non-exportable where practical. GUI/shell expose
identity and bond state, not raw keys. Trusted pairing prompts show exact device,
claimed type, confirmation/passkey, and requested profile/authority; applications
cannot forge them. USB and Bluetooth keyboard/pointer events converge above
transport drivers in the same trusted Input Service/compositor semantic model.

## Network & Devices GUI and accessibility

The first-party semantic settings UI progressively exposes Ethernet status,
speed, DHCP/static IP, IPv4/IPv6, DNS/routes/power; Wi-Fi radio, networks,
security/signal, connection, saved/forget/auto-connect/MAC privacy; and Bluetooth
radio, discovery, pairing, connection, type, profiles, battery, and device policy.
Secret entry uses trusted input.

Every important GUI action maps to the same operation as shell/API—for example
GUI Forget and `Remove-WifiProfile` invoke the same profile removal. Keyboard,
HiDPI, focus, speech, Braille, and authorized AI receive equivalent semantic
state. SSID/device selection is never visual-only. AI may inspect connection state
without credential export, arbitrary pairing, route modification, or a privileged
special API. Intelligence does not imply authority.

The [unified system monitor](../monitor/SYSTEM_MONITOR.md) may show
adapter/link/connection state, throughput, safe
connection-capability use, Wi-Fi signal, Bluetooth devices, and power state, not
other domains' traffic content. Trusted notifications cover disconnect/change,
device connect, and pairing. Applications cannot impersonate trusted prompts.

## Persistence, power, recovery, and lifecycle

Authenticated capability-controlled configuration stores Wi-Fi profiles, DNS,
static interfaces, and Bluetooth bond references as data, never bearer authority;
fresh capabilities reconstruct after boot. Audit records profile/config change,
adapter disable, and pairing without nearby-SSID history, packets, passwords, or
keys.

System LowPower/Balanced/Performance policy may tune Wi-Fi saving/scans,
Bluetooth LE preference, or latency, but never expands network authority. Driver/
firmware identity/version/state are inspectable without low-level authority.

For a microVM component, network access is a separately authorized projection.
Projection failure may leave the guest offline where its policy permits or fail
the operation when networking is required; strict Total MicroVM mode never moves
the component to native placement to restore network access. See
[../ISOLATION_PLACEMENT.md](../ISOLATION_PLACEMENT.md).

One network service/driver crash remains one crash: revoke stale authority,
reset/reinitialize where authorized, restart a clean generation, and reconnect
under policy without requiring system reboot where practical. Recovery networking
is optional and narrowly capable; offline recovery and installation remain
complete. Text/GUI installers reuse the network API for optional online work
rather than inventing a separate stack, except for explicitly transitional
bootstrap constraints.

## Verification and roadmap

The initial typed CLI milestone covers Ethernet enumerate/enable/DHCP/static/DNS/
state; Wi-Fi enumerate/scan/connect/disconnect/save/forget; and Bluetooth
enumerate/enable/scan/pair/connect/disconnect/unpair with capability checks. After
semantic GUI/services, Network & Devices proves CLI-equivalent behavior, keyboard,
HiDPI, Braille/speech where available, and secret non-disclosure.

Tests cover Ethernet DHCP/static/IPv6/DNS/routes, stale identity, denial, restart,
and bounds; Wi-Fi scan/association/authentication/profile/forget/wrong-secret/
redaction/MAC policy/denial/malformed input/restart; Bluetooth scan/pair/reject/
bond/reconnect/unpair/HID/audio/GATT separation/redaction/malformed traffic/reset.
Fuzz bounded network configuration, saved-profile, Wi-Fi management, Bluetooth
HCI/L2CAP/ATT/GATT/profile codecs. Physical claims require exact devices/firmware.

Patent review: `TRIGGERED` — connection configuration transactions, rollback,
privacy identities, pairing/profile mediation, and lifecycle compositions require
mechanism-specific Canadian review before implementation. See
[`../patents/REVIEW_LOG.md`](../patents/REVIEW_LOG.md).
