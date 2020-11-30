function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

$(function () {
    var table = document.getElementsByClassName("tab-table")[0];
    var dataEl = document.getElementsByTagName("backend-data")[0];
    var data = JSON.parse(b64DecodeUnicode(dataEl.innerHTML));
    var isAdmin = Boolean(Number(dataEl.getAttribute("isadmin")));

    var tab = new Tabulator(table, {
        layout: "fitDataFill",
        columns: [{
                title: "Id",
                field: "id"
            }, {
                title: "Pfadiname",
                field: "sname"
            },
            {
                title: "Vorname",
                field: "fname"
            },
            {
                title: "Nachname",
                field: "lname"
            },
            {
                title: "Zombie Level",
                field: "zombie_level",
                formatter: function (cell) {
                    return `<div class="d-flex h-100 w-100">
                        <div class="d-block-inline h-100" style="width: ${cell.getData().zombie_level}%; background-color: brown;"></div>
                        <div class="d-block-inline h-100" style="width: ${100-cell.getData().zombie_level}%; background-color: green;"></div>
                        </div>
                    `;
                },
                minWidth: 120,
                // formatterParams: {
                //     color: ["green", "red"]
                // }
            },
            {
                title: "",
                formatter: function (cell) {
                    return (isAdmin ? `<a class="btn btn-sm btn-danger mr-1" onclick="(confirm('Sicher') ? function () { window.location.href = '/delete/${cell.getData().id}' } : function() {}) ()"><i class="fa fa-trash"></i></a>` : "") +
                        `<a class="btn btn-sm btn-primary" href="/edit/${cell.getData().id}"><i class="fa fa-edit"></i></a>`
                },
                headerSort: false,
                hozAlign: "right",
                minWidth: "100px",
            }
        ]
    });
    tab.addData(data);
})