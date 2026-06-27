# Courier Rush

Endless runner 3D em rodovias brasileiras, construído com Three.js e Vite. Toda a arte atual é procedural e original.

## Frota e garagem

- 10 veículos originais com progressão do nível 1 ao 50
- Modelos low-poly procedurais com rodas, suspensão, iluminação e materiais premium
- Garagem 3D cinematográfica com atributos e câmera rotativa
- Personalização persistente de pintura, faixa refletiva e nome
- Oito implementos desbloqueáveis para os cavalos mecânicos

## Executar

```bash
npm install
npm run dev
```

Use as setas ou `A`/`D` no desktop. Em telas de toque, deslize horizontalmente. `Esc` ou `P` pausa a rota.

## Verificação

```bash
npm run build
npm run preview
npm run test:visual
```

O teste visual usa o Microsoft Edge instalado no Windows e salva capturas em `artifacts/`.

O perfil mobile com CPU limitada pode ser executado com `npm run profile:mobile`. O jogo reduz automaticamente DPR, partículas, sombras e distância de visão apenas quando detecta frames lentos persistentes.

Veja a metodologia e os resultados em [PERFORMANCE.md](PERFORMANCE.md).
