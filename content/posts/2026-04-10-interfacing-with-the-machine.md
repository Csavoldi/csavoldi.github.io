---
title: Interfacing with the machine
date: 2026-04-10
summary: SSH basics, plus the ports and protocols I keep running into in the homelab.
slug: interfacing-with-the-machine
---

What, are you expecting me to **wax** poetic about an SSH session? Anyway... One of the first things I learned when I started out was connecting to a
remote machine using SSH. This made setting up a VM or VPS easy and I don't have to be there in person; it would be pretty lame to have to drive to Seattle or San Francisco
to set up a new server, or even to walk 5 feet across my office :tired_face: :wink:.

The default port is 22, but it's best to change this if the machine is internet facing. You can pick an arbitrary number in the upper range, just make sure it doesn't conflict with any exposed ports.

SSH lets you work on a remote machine as if you were sitting in front of it. If you are logging into a machine at work you will be assigned a username and password, and
you will probably need to set up an SSH key as well. The key gets registered on the remote machine so it knows you are a valid user and lets you log in without a password.

## Ports and protocols I keep running into

I keep a cheat sheet of the protocols that show up over and over in the homelab and at work. Yours will look different, but this covers most of what I touch week to week:

| Protocol | Acronym | Port | What it does |
| --- | --- | --- | --- |
| Secure Shell | SSH | 22 | Encrypted remote terminal access |
| Telnet | TELNET | 23 | Unencrypted remote access, what SSH replaced |
| Hypertext Transfer Protocol | HTTP | 80 | Unencrypted web traffic |
| HTTP Secure | HTTPS | 443 | Encrypted web traffic |
| Domain Name System | DNS | 53 | Resolves domain names to IP addresses |
| Bootstrap Protocol | BOOTP | 68 | Bootstraps hosts on a network, DHCP's ancestor |
| Trivial File Transfer Protocol | TFTP | 69 | Bare-bones file transfer, common with PXE boot |
| Dynamic Host Configuration Protocol | DHCP | 67 | Assigns IP addresses to devices dynamically |
| Network Time Protocol | NTP | 123 | Synchronizes computer clocks on a network |
| Simple Network Management Protocol | SNMP | 161 | Monitors and manages network devices remotely |
| Internet Key Exchange | IKE | 500 | Negotiates the keys for IPsec tunnels |
| Internet Protocol Security | IPsec | 50, 51, 500 | Encrypted communication, common in VPNs (ESP/AH/IKE) |
| Syslog | SYSLOG | 514 | Collects and stores log messages |
| Universal Plug and Play | UPnP | 1900 | Lets devices discover each other and communicate |
| Internet Relay Chat | IRC | 194 | Real-time text messaging protocol |
| NetBIOS Name Service | netbios-ns | 137 | Resolves NetBIOS names to IP addresses on a Windows LAN |
| OpenPGP | OpenPGP | 11371 | Encrypts and signs data and communications |
| X Display Manager Control Protocol | XDMCP | 177 | Remote login to a machine running X11 |
| X Window System | X11 | 6000-6063 | Provides the GUI on Unix-like systems |
| Remote Desktop Protocol | RDP | 3389 | Graphical remote access to Windows machines |
| Virtual Network Computing | VNC | 5900 | Graphical desktop sharing |

And a few service ports that get mistaken for protocols but are worth knowing anyway:

| Service | Port | Notes |
| --- | --- | --- |
| MySQL | 3306 | Open-source database management system |
| PostgreSQL | 5432 | Object-relational database management system |
| Microsoft SQL Server Browser | 1434 | Locates SQL Server instances on the network |
