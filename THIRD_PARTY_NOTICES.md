# Third-party notices

The application uses the following packages. Their own licenses apply independently of this project's source. No code, images, audio, or watermark from the reference Chánh Điện repository are bundled.

| Dependency | Source | License |
|---|---|---|
| ASP.NET Core / SignalR | https://github.com/dotnet/aspnetcore | MIT |
| TikTokLive_Sharp 1.2.3 | https://www.nuget.org/packages/TikTokLive_Sharp/1.2.3 | Publisher's MIT license file, reproduced below |
| Newtonsoft.Json | https://github.com/JamesNK/Newtonsoft.Json | MIT |
| protobuf-net | https://github.com/protobuf-net/protobuf-net | Apache-2.0 |
| React / React DOM | https://github.com/facebook/react | MIT |
| Vite | https://github.com/vitejs/vite | MIT |
| TypeScript | https://github.com/microsoft/TypeScript | Apache-2.0 |
| Vitest | https://github.com/vitest-dev/vitest | MIT |
| xUnit | https://github.com/xunit/xunit | Apache-2.0 |
| Be Vietnam Pro, optional Google Fonts stylesheet | https://github.com/bettergui/BeVietnamPro | SIL Open Font License 1.1 |

Versions are pinned by the NuGet project references and npm lockfile. Vite, TypeScript, Vitest, and xUnit are development/test tools. Node.js is not required by the published backend. No AGPL Node TikTok connector is included.

## TikTokLive_Sharp 1.2.3

The NuGet package identifies source commit `6a7465a877df9da6e201c8250641962843efb5d6` in https://github.com/frankvHoof93/TikTokLiveSharp. Source inspection also used the public fork https://github.com/obulut05/TikTokLiveSharp at `33bb024d39c3d66f18322f6ee966115ff20f05b6`; runtime and decoder tests use the NuGet binary, not a copied fork.

The package's `LICENSE.md` states:

```text
MIT License

Copyright (c) 2024 Frank van Hoof

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
The user shall attempt to attribute usage of the Software to the Copyright-Holder.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

TikTokLiveSharp/TikTokLiveUnity is a fork/continuation of sebheron's
TikTokLiveSharp V0.1.4 (https://github.com/sebheron/TikTokLiveSharp).
The original project uses the same MIT-License as this one.
```
