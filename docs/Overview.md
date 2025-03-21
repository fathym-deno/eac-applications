---
title: 'EaC Runtime Introduction'
path: './'
description: 'An introduction to the EaC Runtime and what you can do with it'
tags: ['DenoJS', 'EaC Runtime', 'Microfrontends']
date: '2022-02-22'
params:
  author: 'Michael Gearhardt (CTO)'
---

# Introduction to EaC (Everything as Code) Runtime

## Overview

The EaC Runtime is a powerful runtime environment that allows you to
effortlessly orchestrate and deliver performant micro applications in any
environment. Serve from the cloud with Deno Deploy, Azure, AWS and more, or
serve from edge devices like a Raspberry PI to deliver unique experiences for
end users.

The runtime provides a configuration model, the EaC (Everything as Code) Model,
to deliver applications at scale with ease.

## Key Features

- **Proxies**: Configure proxy settings to forward incoming requests to backend
  services or other external resources.
- **Generative AI**: Enable generative AI capabilities to add interactive and
  intelligent conversation and agent capabilities to your applications without
  writing any code.
- **Preact Apps**: Leverage an island architecture to deliver unique experiences
  for end users.
- **APIs**: Develop APIs to serve as the backend for your applications.
- **User Authentication** for your applications, allowing users to securely sign
  in with their preferred identity providers.
- **Content Caching**: Serving as an edge content cache for any configured
  request. Cut down on the traffic to existing infrastructure for HTML, JS, CSS,
  JSON/APIs and more.
- **Hosting**: Define the hosting settings for your single-page applications
  (SPAs) and static sites, allowing you to serve them with ease and augment
  their features.
- **Redirects**: Define redirect rules to redirect incoming requests based on
  various criteria.
- **More**: As an open source project, our gaol is to provide you more of the
  features you want, support the development of community plugins, and create an
  extensible runtime.

## EaC Runtime Configuration

The core concept behind the EaC Runtime is the EaC Runtime configuration. By
leveraging this configuration, you can easily define and customize various
aspects of your micro applications, enabling you to enhance their functionality
and adapt them to your specific requirements. By leveraging a
configuration-based approach, you can easily manage and modify your
application's behavior without the need for extensive code changes.

Leverage turnkey, community or custom
[plugins](configuration/plugins/Overview.md) to easily provide new features to
your micro applications.

## Getting Started

To get started with the EaC Runtime, follow these steps:

1. <a href="https://docs.deno.com/runtime/manual/getting_started/installation" target="_blank">Install
   DenoJS</a> on your system if you haven't already done so.
2. [Create an EaC Runtime project](getting-started/Install.md) and setup the
   configuration file for your micro applications.
3. [Configure](getting-started/Configure.md) the necessary settings within the
   EaC config file according to your requirements, such as redirects, proxies,
   user authentication, generative AI, and hosting configurations.
4. Start the EaC Runtime using a command line interface.
5. [Deploy](getting-started/Deploy.md) the Eac Runtime locally, to the cloud or
   at the edge.

With these steps, you can harness the power of EaC Runtime to effortlessly
orchestrate your micro applications and leverage its various features for
enhanced functionality.

## Summary

The EaC Runtime empowers developers to easily orchestrate micro applications by
leveraging a configuration-based approach. By configuring an EaC config file,
you can define redirects, proxies, user authentication, generative AI chat, and
hosting settings, among others, thereby enhancing your micro applications'
capabilities without extensive code changes.

With the EaC Runtime, you can streamline the development and deployment of your
micro applications, enabling you to focus more on creating innovative
experiences for your users.

If you need further assistance or have any questions, feel free to reach out.

Happy coding with EaC Runtime!
