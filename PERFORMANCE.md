# Performance

## Perfil reproduzível

O perfil usa Microsoft Edge headless em viewport mobile `390x844@2x`, CPU limitada em 4× e oito segundos de gameplay:

```bash
npm run build
npm run preview
npm run profile:mobile
```

## Resultado

| Métrica | Antes | Depois |
| --- | ---: | ---: |
| FPS médio | 31,5 | 59,7 |
| p95 do frame | 33,5 ms | 16,9 ms |
| p99 do frame | 600,1 ms | 17,0 ms |
| Draw calls | 546 | 135 |
| Crescimento de heap | 16,32 MB | 0,04 MB |
| Long tasks durante gameplay | 13 | 0 |

## Estratégias aplicadas

- instancing de estrada, vegetação, skyline, montanhas, pneus e tráfego
- pools pré-alocados para obstáculos e coletáveis
- remoção de luzes dinâmicas que causavam recompilação de shaders
- HUD atualizado somente quando os valores mudam e limitado a 10 Hz
- alocações por frame removidas da simulação e do render bridge
- partículas com buffers reutilizados e limites adaptativos
- DPR, sombras, partículas, distância de visão e revelação de tráfego governados por frame time
- listeners de toque passivos e blur do HUD removido apenas no mobile

Os números são comparativos e reproduzíveis neste ambiente; aparelhos reais podem variar conforme GPU, navegador e temperatura.
