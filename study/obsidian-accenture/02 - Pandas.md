---
tags: [accenture, python, pandas]
---
# 🐼 Pandas = Excel dentro de Python
← [[00 - Índice]] · base: [[01 - Python]]

- **DataFrame (`df`)**: la tabla entera (filas y columnas).
- **Series**: una sola columna.

| Quiero… | Código | Nota |
|---|---|---|
| Abrir CSV | `df = pd.read_csv("x.csv")` | CSV = tabla en texto con comas |
| Ver | `df.head()`, `df.shape`, `df.info()` | Primeras filas · (filas, cols) · tipos y vacíos |
| 1 columna | `df["precio"]` | Devuelve Series |
| Varias columnas | `df[["precio","cant"]]` | Doble corchete = **lista** de nombres |
| Filtrar | `df[df["precio"] > 100]` | `&` = y, `\|` = o, `==` = igual |
| Fila/col por nombre | `df.loc[0, "precio"]` | **l**oc = **l**abel (etiqueta) |
| Fila/col por posición | `df.iloc[0, 2]` | **i**loc = **i**nteger (número) |
| Columna nueva | `df["total"] = df["precio"] * df["cant"]` | Como fórmula de Excel |
| Ordenar | `df.sort_values("precio", ascending=False)` | False = de mayor a menor |
| Agrupar | `df.groupby("pais")["total"].sum()` | = tabla dinámica · también `.mean()` `.count()` |
| Vacíos | `df.isnull().sum()` · `dropna()` · `fillna(0)` | NaN = celda vacía |
| Unir tablas | `pd.merge(a, b, on="id", how="left")` | = JOIN / BUSCARV (ver [[03 - SQL y BigQuery]]) |
| Guardar | `df.to_csv("out.csv", index=False)` | Sin columna de índice |

💡 Si sabés hacerlo en Excel, ya sabés la idea.
