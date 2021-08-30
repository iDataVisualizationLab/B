# Run this app with `python app.py` and
# visit http://127.0.0.1:8050/ in your web browser.

import dash
import dash_core_components as dcc
import dash_html_components as html
from dash.dependencies import Input, Output
import plotly.express as px

import processing


app = dash.Dash(__name__)

files = [
    'data/file_1.json',
    'data/file_2.json',
]

app.layout = html.Div([
    html.Div([

        html.Div([
            'File selection: ',
            dcc.Dropdown(
                id='file-selection',
                options=[{'label': i, 'value': i} for i in files],
                value='data/file_1.json'
            )
        ], style={'width': '48%', 'display': 'inline-block'}),

        html.Div([
            'number of neighbors: ',
            dcc.Slider(
                id='k-neighbors',
                min=2,
                max=20,
                value=5,
                marks={str(i): str(i) for i in range(2, 21, 1)},
                step=1
            )
        ]),

        html.Div([
            'threshold for detecting outlier: ',
            dcc.Slider(
                id='threshold',
                min=1.2,
                max=2,
                value=1.5,
                marks={str(i/10): str(i/10) for i in range(12, 20, 1)},
                step=0.1
            )
        ]),

        html.Div([
            'limit for detecting outlier: ',
            dcc.Slider(
                id='limit',
                min=5,
                max=50,
                value=10,
                marks={str(i): str(i) for i in range(5, 51, 1)},
                step=1
            )
        ]),

        html.Div([
            'window size: ',
            dcc.Slider(
                id='window-size',
                min=1,
                max=100,
                value=60,
                marks={str(i): str(i) for i in range(1, 101, 1)},
                step=1
            )
        ]),

        html.Div([
            'stride: ',
            dcc.Slider(
                id='stride',
                min=1,
                max=20,
                value=1,
                marks={str(i): str(i) for i in range(1, 21, 1)},
                step=1
            )
        ]),

    ]),

    dcc.Graph(
        id='anomaly-vs-clumpy',
    )
])


@app.callback(
    Output('anomaly-vs-clumpy', 'figure'),
    Input('file-selection', 'value'),
    Input('k-neighbors', 'value'),
    Input('threshold', 'value'),
    Input('limit', 'value'),
    Input('window-size', 'value'),
    Input('stride', 'value'))
def update_graph(file_name, k, threshold, limit, w, s):
    result = processing.process_data.run(file_name, k, threshold, limit, w, s)

    df = {
        'anomaly': [],
        'clumpy': [],
        'name': [],
    }

    for p in result['metrics']:
        df['anomaly'].append(result['metrics'][p]['anomaly'])
        df['clumpy'].append(result['metrics'][p]['clumpy'])
        df['name'].append(p)

    fig = px.scatter(df, x="anomaly", y="clumpy", hover_name="name",
                     log_x=False, )

    return fig


if __name__ == '__main__':
    app.run_server(debug=True)